"use client";
import React, { Suspense, use, useEffect, useState } from "react";
import Note from "./Note";
import { Button } from "@tremor/react";
import ReactErrorBoundary from "react-error-boundary";

export default function Scrollable<T>({itemComponent, batchGetter} 
    : {
        itemComponent: (params : {data : T}) => JSX.Element, 
        batchGetter: (page : number) => Promise<Array<T>>
    }) {
    const [items, setItems] = useState<Array<T>>([]);
    const [loading, setLoading] = useState(true);
    const [allDone, setAllDone] = useState(false);

    useEffect(() => {
        console.log("Getting initial items")
        batchGetter(0).then((newItems) => {
            console.log(`Got ${newItems.length} items`)
            setItems(newItems);
            setLoading(false);
        });
    }, []);

    const handleMore = (e : any) => {
        if (loading) {
            return;
        }

        setLoading(true);
        batchGetter(items.length).then((newItems) => {
            if (newItems.length === 0) {
                setAllDone(true);
            } else {
                setItems([...items, ...newItems]);
            }
            setLoading(false);
        });
    }
    console.log(`Rendering ${items.length} items`);

    let buttonText = loading ? "Loading..." : "Load more";
    if (allDone) {
        buttonText = "No more items.";
    }

    return (<>
            {items.map((item, ind) => {
                return <div key={`item-${ind}`}>
                    {itemComponent({data: item})}
                </div>
            })}
            <Button onClick={handleMore} disabled={allDone || loading} className="w-full">{buttonText}</Button>
    </>);

}