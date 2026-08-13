# R-033 clean-sheet V4 instrument

This directory preserves the rejected V4.1 pre-collection freeze. It contains
five separate mechanism implementations. They share only typed contracts,
detector definitions and immutable synthetic request fixtures; they do not share
a secret resolver or a generic inference/refresh/discovery implementation.

`instrument.ts` freezes all CC-01…14 candidate rows, separate inference,
refresh and discovery requests, S0-S8 × eight-layer candidate-path and positive,
per-candidate clean-negative and secret-bearing cyclic-serialization plans. Its
pre-collection gate requires an independent review record whose exact instrument
and fixture hashes match current files. Candidate collection is deliberately not
implemented: even with a review record, `collectV4` stops at the handoff.

[`precollection-freeze.json`](precollection-freeze.json) records the exact
instrument and fixture-plan hashes awaiting that review. Any instrument edit
invalidates the freeze and requires a new manifest plus renewed review.

Independent review found that these controls are not an executable staged
`CC-01…14` collector. In particular, CC-10 success/throw do not traverse
`DurableSpy`; staged refresh failures, claim-based account derivation and
discovery no-render failure are absent; and the contained runner produces no
rotating per-cell candidate-result carrier. The pre-collection test is limited to schema/symmetry, executed candidate-path,
detector and CC-10 success/throw/cyclic fail-before-durable controls. The
disposable child/runner freezes empty-credential environment, throwing network
APIs, home/keychain/listener denial and evidence-only write-root checks. It does not run the
inference, refresh, discovery or full candidate comparison matrix and produces no
evidence carrier, candidate conformance result, synthesis or winner. This freeze
is rejected trace only; `collectionAuthorized` remains false.
