"use client";
import Image from 'next/image'
import { Search } from 'grommet-icons';
import { Suspense, startTransition, use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Examples from './examples';
import Results from './results/results';
import { type QueryStatus } from './api/search';
import { countRatings } from './db';
import { runQuery } from './api/search';
import { Anchor, Box, Heading, Skeleton, Spinner, Tag, Text, TextInput, Tip } from 'grommet';

export default function Home() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<QueryStatus | null>(null);
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
    setStatus(null);
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
      runQuery(query).then((status) => {
        setStatus(status);
        setIsLoading(false);
      }).catch((e) => {
        console.error(e);
        setIsLoading(false);
      });
    } else {
      router.push(`/`);
      setStatus(null);
    }

  };

  return (
    <Box direction="column" gap="medium" align="center" margin="medium">
      <form className=" w-full" onSubmit={handleSubmit}>
        <TextInput
          size="xl"
          icon={<Search />}
          value={query}
          placeholder="Enter a tweet ID or URL, a user ID, or a plain text query"
          onChange={onQueryUpdate}
        />
      </form>

      <StatusOrExamples loading={isLoading} queryStatus={status} onExampleClick={makeQuery} />
    </Box>
  );
}


function StatusOrExamples({ loading, queryStatus, onExampleClick }:
  { loading: boolean, queryStatus: QueryStatus | null, onExampleClick: (query: string) => void }) {

  if (loading) {
    return <div className="flex justify-center mt-4 mb-8">Loading...</div>
  }

  if (queryStatus) {
    return <QueryStatus initialStatus={queryStatus} />
  }

  return <Examples onExampleClick={onExampleClick} />
}

function QueryStatus({ initialStatus }: { initialStatus: QueryStatus }) {
  let [isPolling, setIsPolling] = useState(false);
  let [status, setStatus] = useState<QueryStatus | null>(null);

  useEffect(() => {
    setStatus(initialStatus);
    if (initialStatus.status !== "done" && initialStatus.status !== "error") {
      setIsPolling(true);
      console.log("Starting polling")
      const poll = async () => {
        if (!status || !status.query) {
          console.log("No query to poll for");
          return;
        }
        const newStatus = await runQuery(status?.query!);
        setStatus(newStatus);
        if (newStatus.status === "done" || newStatus.status === "error") {
          setIsPolling(false);
          clearInterval(interval);
        }
      };
      const interval = setInterval(poll, 3000);
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [initialStatus]);

  if (!status) {
    return <Text color="text-weak">No status available</Text>
  }

  return <Box direction='column' gap="medium" width="full">
    <Box direction="row" gap="small" elevation="small" pad="small" align="center" justify="between">
      <Box direction="row" gap="small" >
        <Text weight="bold">Query status</Text>
        {isPolling && <Spinner as="span" />}
        <Tag value={status.status} size="small" />
      </Box>
      <Box direction="row" gap="medium">
        <SqlQuery sqlQuery={status.sqlQuery} />
        <RunningTimes times={status.times} />
      </Box>
    </Box>
    {status.results ? <Results results={status.results} /> : <Skeleton width="full" height="medium" />}
  </Box >
}

function SqlQuery({ sqlQuery }: { sqlQuery?: string }) {
  if (!sqlQuery) {
    return <Text color="text-weak">SQL not available</Text>
  }

  return <Tip content={
    <Box background='background-contrast' border pad='small'>
      <Text>{sqlQuery}</Text>
    </Box>
  }>
    <Anchor>SQL</Anchor>
  </Tip>;
}

function RunningTimes({ times }: { times?: { generation: number, execution: number } }) {
  if (!times) {
    return <Text color="text-weak">Query times not available</Text>
  }

  return <Box direction="row" gap="small">
    <Text color="text-weak">Generation: {times.generation}ms</Text>
    <Text color="text-weak">Execution: {times.execution}ms</Text>
  </Box>;
}