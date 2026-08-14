import main from './hcode';

process.exitCode = await main(process.argv.slice(2));
