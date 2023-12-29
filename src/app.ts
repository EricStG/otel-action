import { getProvider } from './instrumentation'
import { LocalLogger } from './localLogger'
import { generateTraces } from './traceGenerator'

const run = {
  token: process.env.TEST_TOKEN!,
  owner: process.env.TEST_OWNER!,
  repo: process.env.TEST_REPO!,
  runId: parseInt(process.env.TEST_RUN_ID!),
  attempt: parseInt(process.env.TEST_ATTEMPT_NUMBER!)
}

const provider = getProvider()
const logger = new LocalLogger()

generateTraces(run, logger).finally(async () => await provider.shutdown())
