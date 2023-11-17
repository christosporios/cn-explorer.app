"use client"
import Image from 'next/image'
import { SearchIcon } from "@heroicons/react/solid";
import { Card, TextInput } from "@tremor/react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function Home() {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") as string;

  useEffect(() => {
    if (q) {
      setQuery(q);
      makeQuery(q);
    }
  }, [q]);

  const handleSubmit = (e) => {
    e.preventDefault();
    makeQuery(query);
  }

  const onQueryUpdate = (e) => {
    setQuery(e.target.value);
  }

  const makeQuery = (query : string) => {
    console.log(`Querying for ${query}`);
    router.push(`/?q=${query}`);


  };


  return (<>
    <div className="flex justify-center mt-4">
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
    </>
  );
}
