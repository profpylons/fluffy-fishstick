import { z } from 'zod';
export declare const fetchGameDataTool: {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            search: {
                type: string;
                description: string;
            };
            game_id: {
                type: string;
                description: string;
            };
            page_size: {
                type: string;
                description: string;
            };
            ordering: {
                type: string;
                enum: string[];
                description: string;
            };
            dates: {
                type: string;
                description: string;
            };
            platforms: {
                type: string;
                description: string;
            };
            genres: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function convertToZodSchema(toolDef: typeof fetchGameDataTool): Record<string, z.ZodTypeAny>;
export declare const fetchGameDataZodSchema: Record<string, z.ZodTypeAny>;
export declare function executeFetchGameData(args: any): Promise<any>;
//# sourceMappingURL=mcp-tools.d.ts.map