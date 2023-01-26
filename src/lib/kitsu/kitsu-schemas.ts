import z from 'zod';

export type UserData = UserDataResp['data'][0] & {
  stats: UserDataResp['included'][0]['attributes']['statsData'];
};

export type UserDataResp = z.infer<typeof UserDataResp>;
export const UserDataResp = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        name: z.string(),
        about: z.string(),
      }),
    })
  ),
  included: z.array(
    z.object({
      attributes: z.object({
        statsData: z.object({
          time: z.number().optional(),
          completed: z.number().optional(),
        }),
      }),
    })
  ),
});

export type ConfigFile = z.infer<typeof ConfigFile>;
export const ConfigFile = z.object({
  id: z.string(),
  urls: z.object({
    profile: z.string(),
    library: z.string(),
  }),
  stats: z.object({
    secondsSpentWatching: z.number(),
    completedSeries: z.number(),
  }),
  about: z.string(),
  username: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
});

export type AnimeCache = z.infer<typeof AnimeCache>;
export const AnimeCache = z.array(z.tuple([z.string(), z.string(), z.string()]));

export type LibraryEntries = z.infer<typeof LibraryEntriesSchema>;
export const LibraryEntriesSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        progress: z.number(),
        ratingTwenty: z.number().nullable(),
      }),
    })
  ),
  included: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        episodeCount: z.number().nullable(),
        averageRating: z.string().nullable(),
        endDate: z.string().nullable(),
        startDate: z.string(),
      }),
    })
  ),
});

export const LibraryInfo = z.object({
  data: z.array(
    z.object({
      id: z.string(),
    })
  ),
  included: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        titles: z.object({
          en: z.string(),
          en_jp: z.string(),
        }),
        canonicalTitle: z.string(),
      }),
    })
  ),
});

export const LibraryPatchRespData = z.object({
  data: z.object({
    id: z.string(),
    attributes: z.object({
      progress: z.number(),
    }),
  }),
});
