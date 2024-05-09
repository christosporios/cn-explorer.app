import { ChatIcon, StarIcon, ChartBarIcon } from "@heroicons/react/solid";
import { Suspense } from "react";
import Note from "./Note";
import { notesForParticipantOffset, ratingsForParticipantOffset } from "@/app/db";
import Scrollable from "@/components/Scrollable";
import { Box, Heading, Tab, Tabs } from "grommet";


export default function UserProfile({ id }: { id: string }) {
    return <Box width="full" direction="column">
        <Heading level="3">Participant {id}</Heading>
        <Tabs>
            <Tab title="Ratings">
                <Heading level="4">Submitted ratings</Heading>
                <Scrollable itemComponent={Note} batchGetter={ratingsForParticipantOffset.bind(null, id)} />
            </Tab>
            <Tab title="Notes">
                <Heading level="4">Submitted notes</Heading>
                <Scrollable itemComponent={Note} batchGetter={notesForParticipantOffset.bind(null, id)} />
            </Tab>
            <Tab title="Activity">
                <Heading level="4">Activity</Heading>
            </Tab>
        </Tabs>
    </Box >;
}
