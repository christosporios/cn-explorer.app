"use client"
import { Suspense } from 'react';
import Note from '../../components/Note';
import { QueryResults } from '../api/search';
import { Tweet } from 'react-tweet';
import UserProfile from '@/components/UserProfile';
import GenericTable from '@/components/GenericTable';
import { Box, Text } from 'grommet';

type ResultsProps = {
    results: QueryResults;
}

export default function Results(props: ResultsProps) {
    if (props.results.type === "notes-list") {
        return <Box direction="row" gap="medium" align="center">
            <Notes notes={props.results.notes} />
        </Box>;
    } else if (props.results.type === "ratings") {
        console.log("ratings");
        return <>
            {props.results.ratings.map((rating, ind) => <Note data={rating} key={`rating-${ind}`} />)}
        </>;
    } else if (props.results.type === "user") {
        return <UserProfile id={props.results.userId} />;
    } else if (props.results.type === "table") {
        console.log("table");
        console.log("with data");
        console.log(props.results);
        return <GenericTable data={props.results.results} />;
    }
    return <>
    </>;
}


function Notes({ notes }: { notes: Array<any> }) {
    if (notes.length === 0) {
        return <Text color="text-weak">No notes found.</Text>
    }
    return <Box direction="column" gap="medium">
        {notes.map((note, ind) => <Note data={note} key={`note-${ind}`} />)}
    </Box>
}