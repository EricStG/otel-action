import * as core from '@actions/core'

import { getProvider } from './instrumentation'
import { generateTraces } from './traceGenerator'
import { ActionLogger } from './actionLogger'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token: string = core.getInput('token', {
      required: true,
      trimWhitespace: true
    })

    const owner = core.getInput('owner', {
      required: true,
      trimWhitespace: true
    })
    const repo = core.getInput('repo', {
      required: true,
      trimWhitespace: true
    })

    const runId = core.getInput('runId', {
      required: true,
      trimWhitespace: true
    })
    const attempt = core.getInput('attempt', {
      required: true,
      trimWhitespace: true
    })

    const workflowRun = {
      token,
      owner,
      repo,
      runId: parseInt(runId),
      attempt: parseInt(attempt)
    }

    const provider = getProvider()
    const logger = new ActionLogger()

    await generateTraces(workflowRun, logger).finally(
      async () => await provider.shutdown()
    )
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
