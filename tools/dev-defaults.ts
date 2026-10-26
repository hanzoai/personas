/** Print filename -> TOML for review. This command never edits the user's Dev home. */
import { companyDefaults } from '../src/index.ts'
import { devConfigFiles } from '../src/dev.ts'

process.stdout.write(JSON.stringify(devConfigFiles(companyDefaults()), null, 2) + '\n')
