INSERT OR IGNORE INTO artifacts (
  id,
  slug,
  title,
  artifact_type,
  status,
  summary,
  source_path
) VALUES (
  'art_revenuecat_agent_benchmark',
  'revenuecat-agent-monetization-benchmark',
  'RevenueCat Agent Monetization Benchmark',
  'experiment',
  'published',
  'Repeatable benchmark for testing whether autonomous agents can integrate, validate, and explain a RevenueCat subscription loop.',
  'docs/public/benchmarks/revenuecat-agent-monetization-benchmark.md'
);

INSERT OR IGNORE INTO experiments (
  id,
  slug,
  title,
  hypothesis,
  status,
  metrics_json
) VALUES (
  'exp_revenuecat_agent_benchmark',
  'revenuecat-agent-monetization-benchmark',
  'RevenueCat Agent Monetization Benchmark',
  'A repeatable benchmark will expose where autonomous agents fail or succeed when integrating RevenueCat and turn those failures into high-leverage content and product feedback.',
  'planned',
  '{"primary":["integration_success","validation_pass_rate","source_grounding"],"secondary":["failure_modes","docs_friction","recommended_followups"]}'
);
