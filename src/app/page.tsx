"use client";
import Image from 'next/image'
import { Search } from 'grommet-icons';
import { Suspense, startTransition, use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Examples from './examples';
import Results from './results/results';
import { type QueryResults } from './api/search';
import { countRatings } from './db';
import { runQuery } from './api/search';
import { Box, TextInput } from 'grommet';

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QueryResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") as string;

  useEffect(() => {
    setQuery(q);
    if (q) {
      makeQuery(q);
    }
    console.log("New query: ", q);
    setResults(null);
  }, [q]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    makeQuery(query);
  }

  const onQueryUpdate = (e: any) => {
    setQuery(e.target.value);
  }

  const makeQuery = (query: string) => {
    console.log(`Querying for ${query}`);
    if (query) {
      router.push(`/?q=${query}`);
      setIsLoading(true);
      runQuery(query).then((results) => {
        setResults(results);
        setIsLoading(false);
      }).catch((e) => {
        console.error(e);
        setIsLoading(false);
      });
    } else {
      router.push(`/`);
      setResults(null);
    }

  };

  return (
    <Box direction="column" gap="medium" align="center" margin="medium">
      <TextInput
        size="xl"
        icon={<Search />}
        value={query}
        placeholder="Enter a tweet ID or URL, a user ID, or a plain text query"
        onChange={onQueryUpdate}
      />

      <ResultsOrExamples loading={isLoading} results={results} onExampleClick={makeQuery} />
    </Box>
  );
}


function ResultsOrExamples({ loading, results, onExampleClick }:
  { loading: boolean, results: QueryResults | null, onExampleClick: (query: string) => void }) {

  if (loading) {
    return <div className="flex justify-center mt-4 mb-8">Loading...</div>
  }

  if (results) {
    return <Results results={results} />
  }

  return <Examples onExampleClick={onExampleClick} />
}