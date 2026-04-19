import ast
import sys
import os
import json
import builtins
from io import StringIO
from dataclasses import dataclass
from capsule import task

@dataclass
class State:
    cwd: str
    env: dict
    lastExitCode: int

    @staticmethod
    def from_json(raw: str) -> "State":
        data = json.loads(raw)
        return State(
            cwd=data["cwd"],
            env=data["env"],
            lastExitCode=data["lastExitCode"],
        )


def wasm_relative(cwd: str, file_path: str) -> str:
    joined = os.path.normpath(os.path.join(cwd, file_path))
    return joined.lstrip("/")


@task(name="executeFile", compute="MEDIUM", ram="512MB", allowed_hosts=["*"])
def execute_file(state: str, file_path: str, args: list[str]):
    state = State.from_json(state)
    rel_path = wasm_relative(state.cwd, file_path)
    file_dir = os.path.dirname(rel_path) or "."

    site_packages = os.path.join(state.cwd, "site-packages")
    if site_packages not in sys.path:
        sys.path.insert(0, site_packages)

    captured_output = StringIO()
    old_stdout = sys.stdout
    old_argv = sys.argv
    old_path = sys.path[:]
    sys.stdout = captured_output
    sys.argv = [rel_path] + list(args)
    sys.path.insert(0, file_dir)

    try:
        with open(rel_path, 'r') as f:
            source = f.read()
        global_env = {
            "__builtins__": builtins,
            "__name__": "__main__",
            "__file__": rel_path,
        }
        exec(compile(source, rel_path, 'exec'), global_env)
    finally:
        sys.stdout = old_stdout
        sys.argv = old_argv
        sys.path[:] = old_path

    output = captured_output.getvalue()
    public_result = {}
    for k, v in global_env.items():
        if k.startswith("__"):
            continue
        try:
            json.dumps(v)
            public_result[k] = v
        except (TypeError, ValueError):
            pass

    if output:
        return output.rstrip("\n") + "\n" + json.dumps(public_result) if public_result else output.rstrip("\n")

    return public_result if public_result else None


@task(name="executeCode", compute="LOW", ram="256MB", allowed_hosts=["*"])
def execute_code(state: str, code: str):
    state = State.from_json(state)

    site_packages = os.path.join(state.cwd, "site-packages")
    if site_packages not in sys.path:
        sys.path.insert(0, site_packages)

    tree = ast.parse(code)

    if not tree.body:
        return None

    last_node = tree.body[-1]
    local_env = {"__builtins__": builtins}

    captured_output = StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured_output

    try:
        if isinstance(last_node, ast.Expr):
            tree.body.pop()
            if tree.body:
                exec(compile(tree, filename="<ast>", mode="exec"), local_env)
            result = eval(
                compile(ast.Expression(last_node.value), filename="<ast>", mode="eval"),
                local_env,
            )
        else:
            exec(compile(tree, filename="<ast>", mode="exec"), local_env)
            result = local_env.get("result")
    finally:
        sys.stdout = old_stdout

    output = captured_output.getvalue()

    if output:
        return output.rstrip("\n") + ("\n" + str(result) if result is not None else "")

    return result


@task(name="main", compute="HIGH")
def main(action: str, state: str, *args: str):
    if action == "PRELOAD":
        response = {"success": True, "result": "Sandbox preloaded successfully", "error": None}
    elif action == "EXECUTE_CODE":
        response = execute_code(state, args[0])
    elif action == "EXECUTE_FILE":
        response = execute_file(state, args[0], list(args[1:]))
    else:
        raise ValueError(f"Invalid action: {action}")

    if isinstance(response, dict):
        if not response.get("success"):
            error = response.get("error")
            if isinstance(error, dict):
                raise Exception(error.get("message", str(error)))
            raise Exception(str(error))
        if response.get("result") is not None:
            return response["result"]

    return response
