type RedisConfig = {
  url: string;
  token: string;
};

export function getRedisConfig(): RedisConfig | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export async function redisCommand(command: string[]) {
  const config = getRedisConfig();
  if (!config) return null;

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Redis command failed with ${response.status}.`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export function hasRedisConfig() {
  return Boolean(getRedisConfig());
}
