export function firmChannel(firmId: string) {
  return `realtime:firm:${firmId}`;
}

export function matterChannel(matterId: string) {
  return `realtime:matter:${matterId}`;
}
