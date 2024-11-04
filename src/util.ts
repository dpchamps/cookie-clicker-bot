export const entriesIntoObject = (entries: Array<[string, unknown]>): Record<string, unknown> => entries.reduce(
    (acc, [key, value]) => ({...acc, [key]: value}),
    {} as Record<string, unknown>
)