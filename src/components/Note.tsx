"use client";
import { Accordion, AccordionBody, AccordionHeader, Badge, Card, Divider, DonutChart, Title } from "@tremor/react";
import { ErrorBoundary } from "react-error-boundary";
import { Tweet } from "react-tweet";

const formatCNClassification = (classification : string) => {
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

    return <Badge color={color}>{text}</Badge>;
}

const formatDateTime = (millis : string) => {
    const text = new Date(parseInt(millis)).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return <span className="italic">{text}</span>;
}

const formatUserId = (id : string) => {
    if (!id) {
        return "???";
    }
    return <a href={`/user/${id}`} className=" text-blue-700 hover:underline">{id.substring(0, 8) + '...'}</a>;
}

export default function Note({data} : {data: any }) {
    console.log(data);
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

    const renderRating = (data : any) => {
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


    return <Card className="hover:cursor-pointer hover:bg-slate-50 mb-8 p-0 "> 
        { data.helpfulness_level ? renderRating(data) : <></> }
        <div className="flex flex-row h-fit p-4">
            
            <div className="basis-1/4 grow-0 shrink-0 relative">
                <Title>Ratings</Title>
                <DonutChart className="min-w-full" data={ratingData} index="name" category="ratings" colors={["green", "red", "blue"]}/>
            </div>
            <div className="basis-3/4 grow-0 shrink-1 relative">
                <Title>Community Note</Title>
                <p className="my-4">User {formatUserId(data.note_author_participant_id)} on {formatDateTime(data.created_at_millis)} thought the parent tweet was {formatCNClassification(data.classification)}</p>
                <p className="text-sm break-all px-2 border-l-slate-700 border-l-2">{data.summary}</p>
            <Divider />
            <Accordion>
                <AccordionHeader className="text-sm">Show parent tweet</AccordionHeader>
                <AccordionBody>
                    <ErrorBoundary fallback={<p>Failed to load tweet.</p>}>
                        <Tweet id={data.tweet_id} />
                    </ErrorBoundary>
                </AccordionBody>
            </Accordion>
            </div>
        </div>
    </Card>
}
