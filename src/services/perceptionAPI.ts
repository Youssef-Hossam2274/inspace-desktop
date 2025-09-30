import { Screenshot, PerceptionResult, UIElement } from "../agent/types";

const PERCEPTION_API_CONFIG = {
  baseUrl: process.env.OMNIPARSER_URL || "http://localhost:8000",
  timeout: 30000,
  endpoints: {
    parse: "/parse/"
  }
};

interface OmniparserApiResponse {
  som_image_base64: string;
  parsed_content_list: Array<{
    bbox?: [number, number, number, number];
    coordinates?: [number, number, number, number];
    text?: string;
    content?: string;
    label?: string;
    type?: string;
    element_type?: string;
    interactivity?: boolean;
    [key: string]: any;
  }>;
  latency: number;
}



export async function callPerceptionApi(screenshot: Screenshot): Promise<PerceptionResult> {
  console.log(`Sending screenshot to Omniparser at ${PERCEPTION_API_CONFIG.baseUrl}`);
  
  try {
    const requestBody = {
      base64_image: screenshot.data
    };

    const response = await fetch(`${PERCEPTION_API_CONFIG.baseUrl}${PERCEPTION_API_CONFIG.endpoints.parse}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(PERCEPTION_API_CONFIG.timeout)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const apiResponse: OmniparserApiResponse = await response.json();
    
    console.log(`API returned ${apiResponse.parsed_content_list?.length || 0} elements`);
    console.log(`Server processing latency: ${apiResponse.latency}s`);
    
    if (apiResponse.parsed_content_list && apiResponse.parsed_content_list.length > 0) {
      console.log(`Sample element structure:`, 
        JSON.stringify(apiResponse.parsed_content_list[0], null, 2).substring(0, 200));
    }

    // Transform API response to our internal format
    const elements: UIElement[] = apiResponse.parsed_content_list?.map((element: any) => ({
      bbox: element.bbox || [0, 0, 0, 0],
      content: element.content || "",
      type: element.type || element.element_type || "unknown",
      interactivity: element.interactivity ?? false
    })) || [];

    
    console.log(`Successfully parsed ${elements.length} UI elements`);
    console.log(elements)
    return {
      elements,
      screenshot,
      success: true
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Error calling perception API: ${errorMsg}`);
    return {
      elements: [],
      screenshot,
      success: false,
      error: errorMsg
    };
  }
}