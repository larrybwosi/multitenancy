'use client'
import { useProducts } from "@/lib/hooks/use-products";
import EditProductForm from "./eddit";

export default function Page (){
  const { data } = useProducts();
  console.log(data && data.data[0]);
  const product = data?.data[0];
  if(!product) {
    return (
      <div>
        <h1>No product found</h1>
      </div>
    );
  }
  return (
    <div>
      <EditProductForm product={product} />
    </div>
  );
}