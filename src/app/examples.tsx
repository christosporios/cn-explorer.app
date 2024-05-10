import { TableIcon, ChartBarIcon, ChatIcon, UserIcon } from "@heroicons/react/solid";
import { Box, Grid, Heading, Text } from "grommet";
import { ReactNode } from "react";

interface ExamplesProps {
    onExampleClick: (query: string) => void;
}

export default function Examples(props: ExamplesProps) {
    const renderExample = (query: string, description: string, icon: any, index: number) => {
        return <Box
            elevation="medium"
            pad="medium"
            key={`example-${index}`}
            onClick={() => props.onExampleClick(query)}>
            <Heading level="5">{query}</Heading>
            <Text color="text-weak">{description}</Text>
        </Box>;
    }

    const examples = [
        { query: "1671370284102819841", description: "Shows community notes for a tweet ID", icon: ChatIcon },
        { query: "068C390EB267B4B3447CDBC70616E5E10B7AB49ED22F05AFB253AB6B3513E2B2", description: "Shows community notes for a user ID", icon: UserIcon },
        { query: "Time chart of ratings submitted", description: "Shows a time chart of community note ratings submitted", icon: ChartBarIcon },
        { query: "Most recent notes", description: "Shows a table of the most recently submitted community notes", icon: TableIcon },
        { query: "Users with the most ratings in the last 30 days", description: "Shows a table of the user with the most community note ratings in the last 30 days", icon: TableIcon },
        { query: "Note counts per note topics ", description: "Shows how many notes were determined to be in each topic group", icon: TableIcon },
    ];

    return <Box direction="column" width="full">
        <Heading level="2" alignSelf="center">Example queries</Heading>
        <Grid responsive columns="medium" gap="small" pad="medium">
            {examples.map((example, ind) => renderExample(example.query, example.description, example.icon, ind))}
        </Grid>
    </Box>;
}