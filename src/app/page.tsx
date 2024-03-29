"use client";
import Image from 'next/image'
import { SearchIcon } from "@heroicons/react/solid";
import { Card, TextInput } from "@tremor/react";
import { Suspense, startTransition, use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Examples from './examples';
import Results from './results/results';
import { type QueryResults } from './api/search';
import { countRatings } from './db';
import { runQuery } from './api/search';

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QueryResults | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") as string;

  useEffect(() => {
    if (q === query) return;

    console.log("New query: ", q);
    makeQuery(q);

    if (q) {
      setQuery(q);
    }

    if (q === null) {
      setQuery("");
    }
  }, [q]);

  const handleSubmit = (e : any) => {
    e.preventDefault();
    makeQuery(query);
  }

  const onQueryUpdate = (e : any) => {
    setQuery(e.target.value);
  }

  const makeQuery = (query : string) => {
    console.log(`Querying for ${query}`);
    if (query) {
      router.push(`/?q=${query}`);
      runQuery(query).then((results) => {
        console.log("Query complete");
        console.log(results);
        setResults(results);
      });
    } else {
      router.push(`/`);
      setResults(null);
    }

  };

  return (<>
    <div className="flex justify-center mt-4 mb-8">
      <form className="w-11/12" onSubmit={handleSubmit}>
      <TextInput
        value={query}
        className="w-12/12"
        icon={SearchIcon}
        placeholder="Enter a tweet ID or URL, a user ID, or a plain text query"
        onChange={onQueryUpdate}
      />
      </form>
    </div>

    {results
      ? <Results results={results}/>
      : <Examples onExampleClick={makeQuery} />
    }
  </>);
}
