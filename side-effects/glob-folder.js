import { join as _join } from 'node:path'
import { cwd as _cwd } from 'node:process'
import { globSync as _globSync } from 'glob'

export default pattern => {
  return _globSync(_join(_cwd(), ...pattern))
}

// usage:
// const migrationFiles = await globFolder(['migrations', '/*.js']);
