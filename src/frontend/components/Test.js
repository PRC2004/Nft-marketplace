import { useState, useEffect } from "react";

export default function MyListedItems({ marketplace, nft, account }) {
  const [itemCount, setItemCount] = useState(0);
  const loadListedItems = async () => {
    // Load all sold items that the user listed
    setItemCount(await marketplace.itemCount());
  };

  useEffect(() => {
    loadListedItems();
  }, []);

  return itemCount;
}
