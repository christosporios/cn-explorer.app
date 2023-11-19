"use client";
import Image from 'next/image'
import { SearchIcon } from "@heroicons/react/solid";
import { Card, TextInput } from "@tremor/react";
import { Suspense, startTransition, use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Examples from './examples';
import Results from './results/results';
import { type QueryResults } from './query/query';
import { countRatings } from './db';
import { runQuery } from './query/query';

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Promise<QueryResults> | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") as string;

  useEffect(() => {
    if (q) {
      setQuery(q);
      makeQuery(q);
    }
  }, [q]);

  const handleSubmit = (e : any) => {
    e.preventDefault();
    makeQuery(query);
  }

  const onQueryUpdate = (e : any) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  }

  const makeQuery = (query : string) => {
    console.log(`Querying for ${query}`);
    if (query) {
      router.push(`/?q=${query}`);
      setResults(runQuery(query));
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
        placeholder="Enter a tweet ID or URL, a contributor ID, or a plain text query"
        onChange={onQueryUpdate}
      />
      </form>
    </div>

    {results
      ? <Suspense fallback={<p>loading</p>}> <Results results={use(results)}/> </Suspense>
      : <Examples onExampleClick={makeQuery} />
    }
  </>);
}
