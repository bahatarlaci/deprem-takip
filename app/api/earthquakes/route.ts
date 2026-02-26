import { NextRequest, NextResponse } from "next/server";

import {
  AFAD_BASE_URL,
  AfadUpstreamError,
  QueryValidationError,
  UpstreamResponseError,
  UpstreamTimeoutError,
  fetchAfadEarthquakes,
  parseEarthquakeQuery,
} from "@/lib/afad";
import { EarthquakeApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { query, radialOverridesBounding } = parseEarthquakeQuery(request.nextUrl.searchParams);
    const data = await fetchAfadEarthquakes(query);

    const body: EarthquakeApiResponse = {
      data,
      meta: {
        fetchedAt: new Date().toISOString(),
        count: data.length,
        source: AFAD_BASE_URL,
        radialOverridesBounding,
      },
    };

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    if (error instanceof QueryValidationError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.status },
      );
    }

    if (error instanceof UpstreamTimeoutError) {
      return NextResponse.json(
        {
          error: "AFAD servisi zamanında yanıt vermedi. Lütfen tekrar deneyin.",
        },
        { status: error.status },
      );
    }

    if (error instanceof AfadUpstreamError) {
      const status = error.upstreamStatus && error.upstreamStatus >= 400 && error.upstreamStatus < 500 ? 400 : 502;

      return NextResponse.json(
        {
          error: `AFAD servisi hata döndürdü: ${error.message}`,
        },
        { status },
      );
    }

    if (error instanceof UpstreamResponseError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: "Beklenmeyen bir hata oluştu.",
      },
      { status: 500 },
    );
  }
}
