"use server";

import UserProfile from "@/components/UserProfile";

export default async function UserPage({ params } : {params: {id: string}}) {
    return <UserProfile id={params.id}/>;
}
