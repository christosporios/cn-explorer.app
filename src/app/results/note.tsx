import { Badge, Card, DonutChart, Title } from "@tremor/react";

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

const formatContributorId = (id : string) => {
    return <a href={`/contributor/${id}`} className=" text-blue-700 hover:underline">{id.substring(0, 8) + '...'}</a>;
}

export default function Note({data} : {data: any}) {
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
    return <Card className="hover:cursor-pointer hover:bg-slate-50 my-4 "> 
        <div className="my-2 flex flex-row h-fit">
            <div className="basis-1/4 grow-0 shrink-0 relative">
                <Title>Ratings</Title>
                <DonutChart data={ratingData} index="name" category="ratings" colors={["green", "red", "blue"]}/>
            </div>
            <div className="basis-3/4 grow-0 shrink-1 relative">
                <Title>Community Note</Title>
                <p className="my-4">Contributor {formatContributorId(data.note_author_participant_id)} on {formatDateTime(data.created_at_millis)} thought the parent tweet was {formatCNClassification(data.classification)}</p>
                <p className="text-sm break-all px-2 border-l-slate-700 border-l-2">{data.summary}</p>
            </div>
        </div>
    </Card>
}
