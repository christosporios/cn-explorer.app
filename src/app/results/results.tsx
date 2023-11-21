"use client"
import { Suspense } from 'react';
import Note from './note';
import { QueryResults } from '../query/query';
import { Tweet } from 'react-tweet';

type ResultsProps = {
    results: QueryResults;
}

export default async function Results(props : ResultsProps) {
    console.log(props.results);

    const renderNotes = (notes : Array<any>) => {
        if (notes.length === 0) {
            return <p className="text-center">No notes found.</p>
        }
        return notes.map((note, ind) => <Note data={note} key={`note-${ind}`} />)
    }

    if (props.results.type === "notes-list") {
        console.log("notes-list");
        return <>
            <div className="flex space-x-2 space-y-2 align-top">
                <div className="basis-3/4 shrink-0 grow-0 pt-8 relative">
                    {renderNotes(props.results.notes)}
                </div>
                <div className="basis-1/4 shrink-0 grow-0 relative">
                    <Tweet id={props.results.tweetId} />
                </div>
            </div>
        </>;
    }
    return <>
    </>;
}
