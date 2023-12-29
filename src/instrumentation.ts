import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import {
  BasicTracerProvider,
  ConsoleSpanExporter,
  BatchSpanProcessor
} from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

export const getProvider = (): BasicTracerProvider => {
  // todo: setup OTLP
  // todo: console only on debug
  const exporter = new ConsoleSpanExporter()
  const otlpExporter = new OTLPTraceExporter()

  const provider = new BasicTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'otel-action'
      // todo: version?
    })
  })

  provider.addSpanProcessor(new BatchSpanProcessor(exporter))
  provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter))
  provider.register()
  return provider
}
