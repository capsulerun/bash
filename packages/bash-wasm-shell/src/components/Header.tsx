import { Box, Text, useStdout } from 'ink';
import Spinner from 'ink-spinner';

const logoLarge = [
'                     ......                     ',
'                 ..... :. ....                  ',
'              .....    :.    ....               ',
'           ......      :.       .....           ',
'        ......         :.          .....        ',
'     ......            :.             ......    ',
'    ......             ..             ......    ',
'    ........     ..:::::::::.      ..... ...    ',
'    ............:::...::::::::: .....    ...    ',
'    ...............   .::::::.....       ...    ',
'    ...................:::.....-:        ...    ',
'    ........................::---.       ...    ',
'    .....................:::::---.       ...    ',
'    ...:::::::::::::::..::::-----.       .:.    ',
'    ...:::::::::::::::..::------:.       .:.    ',
'    ...:::::::::::::::..::-----..:::..   .:.    ',
'    ...:::::::::::::::..:---:.     .:::...:.    ',
'    ...:::::::::::::::..:..           .:.::.    ',
'     .....::::::::::::..:           ..::::.     ',
'        .....:::::::::..:         .::::.        ',
'           .....::::::..:     ..:::..           ',
'              ......::..:   .:::.               ',
'                 ......::.:::..                 ',
'                     ..:::.                     ',
'                                             '
]

const logoMedium = [

'               ..               ',
'           ..........           ',
'        .....  :.  ....         ',
'     .....     :.      ....     ',
'   ....        :.         ...   ',
'   ......  ..:::::..   ......   ',
'   ............:::::.....  ..   ',
'   ............:::..::     ..   ',
'   ..............:::--.    ..   ',
'   ..::::::::::.:::---     ..   ',
'   ..::::::::::.:----:::.  .:   ',
'   ..::::::::::.:--:   .:::.:   ',
'   ...:::::::::.:       ..:::   ',
'     ....::::::.:     .::..     ',
'        ....:::.: ..::..        ',
'           .....:::..           ',
'               ..               ',
]



const logoSmall = [
 '          .         ',
 '       .. : ..      ',
 '   ...    :     ..  ',
 '  ...   .::.    ... ',
 '  ......  :::..   . ',
 '  .........::-.   . ',
 '  .:::::::.:--    : ',
 '  .:::::::.--  :: : ',
 '   ..::::::    .:.  ',
 '      ..::: .:.     ',
 '         .::         ',
]


type Props = {
    ready: boolean;
};

export function Header({ ready }: Props) {
    const { stdout } = useStdout();

    return (
        <Box flexDirection="column" borderBottom  borderBackgroundColor="gray"  padding={1} width={stdout?.columns || 80} alignItems="center" justifyContent="center">

            {/* Content Container */}
            <Box flexDirection="column" alignItems="center">

                {/* ASCII Logo */}
                <Box marginBottom={1} flexDirection="column" alignItems="center">
                    {logoMedium.map((line, i) => (
                        <Text key={i}>{line}</Text>
                    ))}
                </Box>

                {/* Info Text Stack */}
                <Box flexDirection="column" alignItems="center">
                    <Box marginBottom={0}>
                        <Text bold>Capsule Bash v0.1.0</Text>
                    </Box>

                    {/* Status */}
                    <Box flexDirection="row" alignItems="center" justifyContent="center">
                        {ready ? (
                            <Text dimColor>✓ Sandbox ready</Text>
                        ) : (
                            <>
                                <Box marginRight={1}>
                                    <Text><Spinner type="dots" /></Text>
                                </Box>
                                <Text dimColor>Loading sandbox…</Text>
                            </>
                        )}
                    </Box>
                </Box>

            </Box>
        </Box>
    );
}
