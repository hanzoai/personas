/** Print a portable defaults bundle for review; never modifies a user's configuration. */
import { companyDefaults } from '../src/index.ts'

process.stdout.write(JSON.stringify(companyDefaults(), null, 2) + '\n')
