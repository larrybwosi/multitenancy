import UnauthorizedPage from "./client";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
 
export default async function SomePageWhereAccessIsDenied(props: {
  searchParams: SearchParams;
}) {
  
  const searchParams = await props.searchParams;
  console.log("Search Params:", searchParams);
  const reason =
    "Your account role does not permit access to the admin dashboard.";

  return (
    <UnauthorizedPage
      message={reason} // Provide the specific reason
      errorCode="403 Forbidden - Role insufficient"
    />
  );
}