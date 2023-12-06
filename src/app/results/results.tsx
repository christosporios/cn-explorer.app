"use client"
import { Suspense } from 'react';
import Note from '../../components/Note';
import { QueryResults } from '../api/search';
import { Tweet } from 'react-tweet';
import UserProfile from '@/components/UserProfile';
import GenericTable from '@/components/GenericTable';

type ResultsProps = {
    results: QueryResults;
}

export default async function Results(props : ResultsProps) {
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
                {props.results.tweetId &&
                <div className="basis-1/4 shrink-0 grow-0 relative">
                    <Tweet id={props.results.tweetId} />
                </div>
                }
            </div>
        </>;
    } else if (props.results.type === "ratings") {
        console.log("ratings");
        return <>
            {props.results.ratings.map((rating, ind) => <Note data={rating} key={`rating-${ind}`} />)}
        </>;
    } else if (props.results.type === "user") {
        console.log("user");
        return <UserProfile id={props.results.userId} />;
    } else if (props.results.type === "table") {
        console.log("table");
        console.log(props.results);
        return <GenericTable data={props.results.results} />;
    }
    return <>
    </>;
}
