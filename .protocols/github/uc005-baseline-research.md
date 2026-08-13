Parent epic: EP-001.

## Decision question

Can the current hyper-code2 runtime support a useful end-to-end capability
extension and later reuse scenario on representative work, and what blocks it?

## Experiment contract

Use three offline task families with deterministic golden output:

1. data normalization and deduplication;
2. repository evidence extraction into a structured report;
3. transformation of a saved JSON API fixture without network or credentials.

For each family compare a one-off baseline with later work by a new agent using
an explicitly retained ordinary callable capability.

## Measurement

- exact correctness against golden output;
- LLM calls and marker actions;
- provider input/output tokens and wall time;
- errors and corrections;
- whether an existing capability was found or duplicated;
- whether control call and fresh-process reuse succeed;
- task-specific code and LLM-visible action-result volume.

Experiment thresholds:

- all three task families produce exact golden output;
- at least two of three later-use agents find and call the retained capability
  without creating a duplicate;
- zero cases where final prose claims success after a failed/incorrect tool result;
- every retained capability passes a control call and fresh-process check;
- no sentinel appears in model-visible messages or events;
- at most six LLM calls per phase under the fixed experiment prompt.

Measurement capture: deterministic experiment runner. Measurement and decision
owner: Danil Pismenny.

## Existing first observation

A first tag-normalization task has been run with scripted mock and
`codex:gpt-5.4`. It proves the technical write/reload/reuse substrate but exposes
discovery friction and one false-success response. Treat it as evidence, not as
validation of the product hypothesis.

## Safety and stop conditions

- trusted local temp workspace; do not start HTTP;
- no real secrets; fixed sentinel only;
- stop on any write outside the temp workspace;
- stop if sentinel reaches model-visible input/result;
- stop after six LLM calls per phase or two uncontrolled execution failures.

## Output

Traceable evidence and a `continue / revise / park / stop` recommendation for
`VAL-01…VAL-05`. Do not create a universal capability-promotion lifecycle.
