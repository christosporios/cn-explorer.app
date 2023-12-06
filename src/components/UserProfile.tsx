import { Tab, TabGroup, TabList, TabPanel, TabPanels, Title } from "@tremor/react";
import { ChatIcon, StarIcon, ChartBarIcon } from "@heroicons/react/solid";
import { Suspense } from "react";
import Note from "./Note";
import { notesForParticipantOffset, ratingsForParticipantOffset } from "@/app/db";
import Scrollable from "@/components/Scrollable";


export default function UserProfile({ id } : {id: string}) {
    return <>
        <Title>Participant {id}</Title>
        <TabGroup>
            <TabList>
                <Tab><StarIcon className="inline-block w-4 mr-1"/>Ratings</Tab>
                <Tab><ChatIcon className="inline-block w-4 mr-1"/>Notes</Tab>
                <Tab><ChartBarIcon className="inline-block w-4 mr-1"/>Activity</Tab>
            </TabList>
            <TabPanels>
                <TabPanel>
                    <Scrollable itemComponent={Note} batchGetter={ratingsForParticipantOffset.bind(null, id)}/>
                </TabPanel>
                <TabPanel>
                    <Scrollable itemComponent={Note} batchGetter={notesForParticipantOffset.bind(null, id)}/>
                </TabPanel>
                <TabPanel>
                    b
                </TabPanel>
            </TabPanels>
        </TabGroup>
    </>;
}
