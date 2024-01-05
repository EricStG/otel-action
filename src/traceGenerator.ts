import * as github from '@actions/github'
import opentelemetry, {
  Attributes,
  Span,
  SpanStatusCode
} from '@opentelemetry/api'

import { GithubAttributes } from './attributes'
import { WorkflowRun } from './configuration'
import { Logger } from './logger'

export const generateTraces = async (
  workflowRun: WorkflowRun,
  logger: Logger
): Promise<void> => {
  const runTracer = opentelemetry.trace.getTracer('workflow-run')
  const jobTracer = opentelemetry.trace.getTracer('workflow-job')
  const stepTracer = opentelemetry.trace.getTracer('workflow-step')

  logger.debug('Initializing Octokit')

  const octokit = github.getOctokit(workflowRun.token)

  logger.info(
    `Getting run information for attempt ${workflowRun.attempt} of run id ${workflowRun.runId} in repository ${workflowRun.owner}/${workflowRun.repo}`
  )
  // todo: try/catch?
  const runResponse = await octokit.rest.actions.getWorkflowRunAttempt({
    attempt_number: workflowRun.attempt,
    owner: workflowRun.owner,
    repo: workflowRun.repo,
    run_id: workflowRun.runId,
    exclude_pull_requests: true
  })

  if (runResponse.status !== 200) {
    throw new Error(
      `Could not get workflow run attempt information from ${runResponse.url}, status code ${runResponse.status}`
    )
  }

  const run = runResponse.data
  if (run.status !== 'completed') {
    throw new Error(
      `Workflow run attempt has not completed, status was ${run.status}`
    )
  }

  logger.debug(`Adding run ${run.display_title}`)

  // Assuming we have a start time if we have a completed run
  const runStartTime = Date.parse(run.run_started_at!)

  const runAttributes: Attributes = {}
  runAttributes[GithubAttributes.HEAD_SHA] = run.head_sha
  runAttributes[GithubAttributes.OWNER] = workflowRun.owner
  runAttributes[GithubAttributes.REPOSITORY] = workflowRun.repo
  runAttributes[GithubAttributes.RUN_ATTEMPT] = workflowRun.attempt
  runAttributes[GithubAttributes.RUN_ID] = run.id
  runAttributes[GithubAttributes.RUN_PATH] = run.path
  runAttributes[GithubAttributes.RUN_DISPLAY_TITLE] = run.display_title

  if (run.conclusion) {
    runAttributes[GithubAttributes.CONCLUSION] = run.conclusion
  }
  if (run.head_branch) {
    runAttributes[GithubAttributes.HEAD_BRANCH] = run.head_branch
  }

  const runSpan = runTracer.startSpan(run.name ?? run.path, {
    startTime: runStartTime,
    attributes: runAttributes
  })

  setSpanStatus(runSpan, run)

  logger.info(
    `Getting jobs information for attempt ${workflowRun.attempt} of run id ${workflowRun.runId} in repository ${workflowRun.owner}/${workflowRun.repo}`
  )

  // todo: try/catch?
  const jobsResponse = await octokit.rest.actions.listJobsForWorkflowRunAttempt(
    {
      attempt_number: workflowRun.attempt,
      owner: workflowRun.owner,
      repo: workflowRun.repo,
      run_id: workflowRun.runId
    }
  )

  if (jobsResponse.status !== 200) {
    throw new Error(
      `Could not get workflow run job information from ${jobsResponse.url}, status code ${jobsResponse.status}`
    )
  }

  const jobsData = jobsResponse.data

  const runCtx = opentelemetry.trace.setSpan(
    opentelemetry.context.active(),
    runSpan
  )

  let runEndTime = runStartTime

  for (const job of jobsData.jobs) {
    logger.debug(`Adding job ${job.name}`)

    const jobStartTime = Date.parse(job.started_at)
    // Assuming we have an end time, since the run is completed
    const jobEndTime = Date.parse(job.completed_at!)

    if (jobEndTime > runEndTime) {
      runEndTime = jobEndTime
    }

    const jobAttributes: Attributes = {}
    jobAttributes[GithubAttributes.JOB_ID] = job.id
    jobAttributes[GithubAttributes.HEAD_SHA] = job.head_sha

    if (job.conclusion) {
      jobAttributes[GithubAttributes.CONCLUSION] = job.conclusion
    }
    if (job.head_branch) {
      jobAttributes[GithubAttributes.HEAD_BRANCH] = job.head_branch
    }
    if (job.runner_group_id) {
      jobAttributes[GithubAttributes.JOB_RUNNER_GROUP_ID] = job.runner_group_id
    }
    if (job.runner_group_name) {
      jobAttributes[GithubAttributes.JOB_RUNNER_GROUP_NAME] =
        job.runner_group_name
    }
    if (job.runner_id) {
      jobAttributes[GithubAttributes.JOB_RUNNER_ID] = job.runner_id
    }
    if (job.runner_name) {
      jobAttributes[GithubAttributes.JOB_RUNNER_NAME] = job.runner_name
    }
    const jobSpan = jobTracer.startSpan(
      job.name,
      {
        startTime: jobStartTime,
        attributes: jobAttributes
      },
      runCtx
    )

    setSpanStatus(jobSpan, job)

    if (job.steps) {
      const jobCtx = opentelemetry.trace.setSpan(
        opentelemetry.context.active(),
        jobSpan
      )

      for (const step of job.steps) {
        logger.debug(`Adding step #${step.number}: ${step.name}`)

        // Assuming we have start and end times, since the run is completed
        const stepStartTime = Date.parse(step.started_at!)
        const stepEndTime = Date.parse(step.completed_at!)

        const stepAttributes: Attributes = {}
        stepAttributes[GithubAttributes.STEP_NUMBER] = step.number

        if (step.conclusion) {
          stepAttributes[GithubAttributes.CONCLUSION] = step.conclusion
        }

        const stepSpan = stepTracer.startSpan(
          step.name,
          {
            startTime: stepStartTime,
            attributes: stepAttributes
          },
          jobCtx
        )

        setSpanStatus(stepSpan, step)

        stepSpan.end(stepEndTime)
      }
    }

    jobSpan.end(jobEndTime)
  }

  runSpan.end(runEndTime)
}

interface Task {
  conclusion: string | null
}

const setSpanStatus = (span: Span, task: Task): void => {
  if (task.conclusion === 'success') {
    span.setStatus({
      code: SpanStatusCode.OK
    })
  } else if (task.conclusion === 'failure') {
    span.setStatus({
      code: SpanStatusCode.ERROR
    })
  }
}
