import ast
import sys
import os
import json
import runpy
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


@task(name="executeFile", compute="LOW", ram="256MB")
def execute_file(state: State, file_path: str, args: list[str]):
    os.chdir(state.cwd)

    absolute_path = os.path.realpath(os.path.join(state.cwd, file_path))

    captured_output = StringIO()
    old_stdout = sys.stdout
    old_argv = sys.argv
    sys.stdout = captured_output
    sys.argv = [absolute_path] + list(args)

    try:
        result = runpy.run_path(absolute_path, run_name="__main__")
    finally:
        sys.stdout = old_stdout
        sys.argv = old_argv

    output = captured_output.getvalue()
    public_result = {k: v for k, v in result.items() if not k.startswith("__")}

    if output:
        return output.rstrip("\n") + "\n" + json.dumps(public_result) if public_result else output.rstrip("\n")

    return public_result if public_result else None


@task(name="executeCode", compute="LOW", ram="256MB")
def execute_code(state: State, code: str):
    os.chdir(state.cwd)

    tree = ast.parse(code)

    if not tree.body:
        return None

    last_node = tree.body[-1]
    local_env = {}

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
        return output + str(result)

    return result


@task(name="executeCommand", compute="LOW", ram="64MB")
def execute_command(state: State, script_content: str, args: list[str]):
    os.chdir(state.cwd)

    module_env = {}
    exec(compile(script_content, filename="<script>", mode="exec"), module_env)

    execute_fn = module_env.get("execute")
    if not callable(execute_fn):
        raise ValueError("Script must define an 'execute' function")

    return execute_fn(list(args))


@task(name="main", compute="HIGH")
def main(action: str, state: str, *args: str):
    parsed_state = State.from_json(state)

    if action == "LOAD":
        response = {"success": True, "result": "Sandbox loaded successfully", "error": None}
    elif action == "EXECUTE_COMMAND":
        response = execute_command(parsed_state, args[0], list(args[1:]))
    elif action == "EXECUTE_CODE":
        response = execute_code(parsed_state, args[0])
    elif action == "EXECUTE_FILE":
        response = execute_file(parsed_state, args[0], list(args[1:]))
    else:
        raise ValueError(f"Invalid action: {action}")

    if isinstance(response, dict):
        if not response.get("success"):
            raise Exception(response["error"]["message"])
        if response.get("result") is not None:
            return response["result"]

    return response
