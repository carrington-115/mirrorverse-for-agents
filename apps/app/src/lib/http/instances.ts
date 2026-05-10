import ky, { type Options } from "ky";
import { env } from "@mirrorverse/env/app";
import { createClient } from "@/lib/supabase/client";

const baseConfig: Options = {
  baseUrl: env.NEXT_PUBLIC_API_URL,
  retry: {
    limit: 1,
    methods: ["get"],
  },
  timeout: 15_000,
};

export const apiClient = ky.create(baseConfig);

export const authedClient = apiClient.extend({
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          request.headers.set("authorization", `Bearer ${data.session.access_token}`);
        }
      },
    ],
  },
});
