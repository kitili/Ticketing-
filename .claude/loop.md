Run the ticket-intake orchestrator now.

Read any new JSON tickets in inbox/, split each to priority-sorter, ack-writer, and status-advancer (do not do their work yourself), combine into runs/, then run evals/.

If evals fail, stop — do not mark inbox files processed.
