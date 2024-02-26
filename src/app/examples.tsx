import { Card, Col, Grid } from "@tremor/react"; import { propagateServerField } from "next/dist/server/lib/render-server";
import { TableIcon, ChartBarIcon, ChatIcon, UserIcon } from "@heroicons/react/solid";
import { ReactNode } from "react";

interface ExamplesProps {
    onExampleClick : (query : string) => void;
}

export default function Examples(props : ExamplesProps) {
    const renderExample = (query : string, description : string, icon : any, index : number) => {
        return <Card key={`example-${index}`} className="hover:cursor-pointer hover:bg-slate-50" onClick={() => props.onExampleClick(query)}>
            <h3 className="font-bold text-md example">{query}</h3>
            <span className="text-sm italic">{description}</span>
        </Card>;
    }

    const examples = [
        { query: "1671370284102819841", description: "Shows community notes for a tweet ID", icon: ChatIcon },
        { query: "068C390EB267B4B3447CDBC70616E5E10B7AB49ED22F05AFB253AB6B3513E2B2", description: "Shows community notes for a user ID", icon: UserIcon},
        { query: "Time chart of ratings submitted", description: "Shows a time chart of community note ratings submitted", icon: ChartBarIcon },
        { query: "Most recent notes", description: "Shows a table of the most recently submitted community notes", icon: TableIcon },
        { query: "Users with the most ratings in the last 30 days", description: "Shows a table of the user with the most community note ratings in the last 30 days", icon: TableIcon },
    ];

    return <div>
        <h2 className="text-xl my-4 font-bold text-center">Example queries</h2>
        <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-4">
            {examples.map((example, ind) => renderExample(example.query, example.description, example.icon, ind))}
        </Grid>
    </div>;
}