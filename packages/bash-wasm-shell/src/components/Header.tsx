import { Box, Text, useStdout } from 'ink';
import Spinner from 'ink-spinner';

// const logoLarge = [
// '                     ......                     ',
// '                 ..... :. ....                  ',
// '              .....    :.    ....               ',
// '           ......      :.       .....           ',
// '        ......         :.          .....        ',
// '     ......            :.             ......    ',
// '    ......             ..             ......    ',
// '    ........     ..:::::::::.      ..... ...    ',
// '    ............:::...::::::::: .....    ...    ',
// '    ...............   .::::::.....       ...    ',
// '    ...................:::.....-:        ...    ',
// '    ........................::---.       ...    ',
// '    .....................:::::---.       ...    ',
// '    ...:::::::::::::::..::::-----.       .:.    ',
// '    ...:::::::::::::::..::------:.       .:.    ',
// '    ...:::::::::::::::..::-----..:::..   .:.    ',
// '    ...:::::::::::::::..:---:.     .:::...:.    ',
// '    ...:::::::::::::::..:..           .:.::.    ',
// '     .....::::::::::::..:           ..::::.     ',
// '        .....:::::::::..:         .::::.        ',
// '           .....::::::..:     ..:::..           ',
// '              ......::..:   .:::.               ',
// '                 ......::.:::..                 ',
// '                     ..:::.                     ',
// '                                             '
// ]

// const logoMedium = [

// '               ..               ',
// '           ..........           ',
// '        .....  :.  ....         ',
// '     .....     :.      ....     ',
// '   ....        :.         ...   ',
// '   ......  ..:::::..   ......   ',
// '   ............:::::.....  ..   ',
// '   ............:::..::     ..   ',
// '   ..............:::--.    ..   ',
// '   ..::::::::::.:::---     ..   ',
// '   ..::::::::::.:----:::.  .:   ',
// '   ..::::::::::.:--:   .:::.:   ',
// '   ...:::::::::.:       ..:::   ',
// '     ....::::::.:     .::..     ',
// '        ....:::.: ..::..        ',
// '           .....:::..           ',
// '               ..               ',
// ]



// const logoSmall = [
//  '          .         ',
//  '       .. : ..      ',
//  '   ...    :     ..  ',
//  '  ...   .::.    ... ',
//  '  ......  :::..   . ',
//  '  .........::-.   . ',
//  '  .:::::::.:--    : ',
//  '  .:::::::.--  :: : ',
//  '   ..::::::    .:.  ',
//  '      ..::: .:.     ',
//  '         .::         ',
// ]


type Props = {
    jsReady: boolean;
    pythonReady: boolean;
};

export function Header({ jsReady, pythonReady }: Props) {
    const { stdout } = useStdout();

    return (
        <Box flexDirection="column" borderBottom borderStyle="round" borderColor="#444444" marginBottom={1}  padding={1} width={stdout?.columns || 80} alignItems="center" justifyContent="center">

            <Box flexDirection="column" alignItems="center">

                {/* ASCII Logo */}
                {/* <Box marginBottom={1} flexDirection="column" alignItems="center">
                    {logoMedium.map((line, i) => (
                        <Text key={i}>{line}</Text>
                    ))}
                </Box> */}

                <Box flexDirection="column" alignItems="center">
                    <Box marginBottom={1}>
                        <Text bold>Capsule Bash v0.1.0</Text>
                    </Box>

                    <Box flexDirection="row" alignItems="center" justifyContent="center">
                        {jsReady ? (
                            <Text dimColor>✓ JS Sandbox ready</Text>
                        ) : (
                            <>
                                <Box marginRight={1}>
                                    <Text><Spinner type="dots" /></Text>
                                </Box>
                                <Text dimColor>Loading JS sandbox</Text>
                            </>
                        )}
                    </Box>
                    <Box flexDirection="row" alignItems="center" justifyContent="center">
                        {pythonReady ? (
                            <Text dimColor>✓ Python Sandbox ready</Text>
                        ) : (
                            <>
                                <Box marginRight={1}>
                                    <Text><Spinner type="dots" /></Text>
                                </Box>
                                <Text dimColor>Loading Python sandbox</Text>
                            </>
                        )}
                    </Box>
                </Box>

            </Box>
        </Box>
    );
}
