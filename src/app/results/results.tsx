"use client"
import { Suspense } from 'react';
import Note from './note';
import { QueryResults } from '../query/query';

type ResultsProps = {
    results: QueryResults;
}

export default async function Results(props : ResultsProps) {
    console.log(props.results);

    if (props.results.type === "notes-list") {
        console.log("notes-list");
        return <>
            {props.results.notes.map((note, ind) =>  <Note data={note} key={`note-${ind}`} />)}
        </>;
    }
    return <>
    </>;
}
