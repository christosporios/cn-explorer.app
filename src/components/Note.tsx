"use client";
import { DonutChart } from "@tremor/react";
import { Accordion, AccordionPanel, Box, Heading, Tag, Text } from "grommet";
import { ErrorBoundary } from "react-error-boundary";
import { Tweet } from "react-tweet";

const formatCNClassification = (classification: string) => {
    var text = classification;
    var color = "gray";
    switch (classification) {
        case "NOT_MISLEADING":
            text = "not misleading";
            color = "green";
            break;
        case "MISINFORMED_OR_POTENTIALLY_MISLEADING":
            text = "misinformed or potentially misleading";
            color = "red";
            break;
    }

    return <Tag background={color} value={text} as="span" size="small" />;
}

const formatDateTime = (millis: string) => {
    const text = new Date(parseInt(millis)).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return <span className="italic">{text}</span>;
}

const formatUserId = (id: string) => {
    if (!id) {
        return "???";
    }
    return <a href={`/user/${id}`} className=" text-blue-700 hover:underline">{id.substring(0, 8) + '...'}</a>;
}

export default function Note({ data }: { data: any }) {
    const ratingData = [
        {
            "name": "Helpful",
            "ratings": parseInt(data.ratings_count_helpful)
        },
        {
            "name": "Not Helpful",
            "ratings": parseInt(data.ratings_count_not_helpful)
        },
        {
            "name": "Somewhat Helpful",
            "ratings": parseInt(data.ratings_count_somewhat_helpful)
        }
    ];

    const renderRating = (data: any) => {
        let color = "blue";
        if (data.helpfulness_level === "NOT_HELPFUL") {
            color = "red";
        } else if (data.helpfulness_level === "HELPFUL") {
            color = "green";
        }

        return <div className={`w-full bg-${color}-200 p-4 pb-1`}>
            Rated as {data.helpfulness_level} on {formatDateTime(data.rating_created_at_millis)}
        </div>
    }


    return <Box direction="row" elevation="small" gap="medium" pad="medium">


        <Box basis="1/4">
            <Heading level="4">Ratings</Heading>
            <DonutChart className="min-w-full" data={ratingData} index="name" category="ratings" colors={["green", "red", "blue"]} />
        </Box>
        <Box direction="column" basis="3/4">
            <Heading level="4">Details</Heading>
            <Text>
                {data.helpfulness_level ? renderRating(data) : <></>}
            </Text>
            {formatCNClassification(data.classification)}
            <Text>
                By user {formatUserId(data.note_author_participant_id)} on {formatDateTime(data.created_at_millis)}
            </Text>
            <Box background="background-back" border pad="small" margin="small" className=" break-words">
                <Text size="small" >
                    {data.summary}
                </Text>
            </Box>
            <Accordion>
                <AccordionPanel label="Show parent tweet">
                    <ErrorBoundary fallback={<p>Failed to load tweet.</p>}>
                        <Tweet id={data.tweet_id} />
                    </ErrorBoundary>

                </AccordionPanel>
            </Accordion>
        </Box>
    </Box>;
}
