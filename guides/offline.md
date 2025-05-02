# Integrating TanStack Query v5+ and Legend State v3

Integrating TanStack Query v5+ and Legend State v3 for Offline-First ApplicationsThe demand for web applications to remain functional and responsive even without a consistent internet connection has grown significantly. This necessitates the implementation of offline capabilities, allowing users to interact with applications and their data regardless of network availability. TanStack Query v5+ (formerly known as React Query) emerges as a powerful tool for managing asynchronous state, excelling in data fetching, caching, and the synchronization of server-side data.1 This library effectively addresses the inherent complexities of server state management, including caching mechanisms and background update strategies, which often pose challenges for traditional client-side state management solutions.1 Complementing this, Legend State v3 beta 30 presents itself as an exceptionally fast and reactive state management library, equipped with built-in functionalities for local data persistence and synchronization.4 Its design prioritizes ease of use, high performance, fine-grained reactivity for efficient UI updates, and robust features for data synchronization and persistence.5The combination of TanStack Query for efficient data retrieval and Legend State for managing data locally and ensuring synchronization creates a potent architecture for developing offline-first web applications. While TanStack Query specializes in fetching and caching data from remote sources, Legend State provides the necessary layer for persisting this data locally, which is essential for offline scenarios. Furthermore, Legend State's synchronization capabilities facilitate the seamless updating of local data with server-side changes and vice versa when the application regains network connectivity. This collaboration allows for a clear separation of concerns within the application's architecture, leading to a more maintainable and scalable codebase.TanStack Query v5+ FundamentalsAt the core of TanStack Query v5+ lies a set of fundamental concepts that govern how data is fetched, cached, and managed. Query Keys serve as unique identifiers for each query, playing a crucial role in TanStack Query's ability to cache, refetch, and share query results throughout the application.10 For scenarios involving dynamic data or related queries, it is recommended to utilize arrays as query keys, allowing for the inclusion of variables that uniquely identify the specific data being requested.12 Query Functions are asynchronous functions responsible for fetching data from an API or other data source. These functions should return a promise that either resolves with the requested data or throws an error if the data retrieval fails.10TanStack Query employs an automatic in-memory Caching mechanism that significantly enhances application performance by serving previously fetched data almost instantly, thereby reducing the need for redundant API calls.2 The concept of Stale Time defines the duration for which cached data is considered "fresh." If the cached data is older than the specified stale time, TanStack Query will automatically refetch it in the background the next time the query is accessed.3 This allows developers to control the frequency of data updates, balancing between data freshness and the number of API requests. Cache Time, now accurately termed gcTime in v5, specifies how long inactive query data remains in the cache before being marked for garbage collection.3 This setting helps manage memory usage by preventing the cache from growing indefinitely with data that is no longer being used.10 Finally, TanStack Query offers Background Refetching capabilities, automatically refetching data in the background when it becomes stale or when the user switches back to the application window or tab.1 This feature ensures that the displayed data remains reasonably up-to-date without requiring explicit user interaction.To make API calls using TanStack Query in a TypeScript environment, the useQuery hook is employed.11 A basic implementation involves calling useQuery with a unique query key and a query function that returns a promise resolving to the desired data. TanStack Query provides properties such as isPending (formerly isLoading), isError, isSuccess, data, and error to help manage the different states of the data fetching process.11 TypeScript examples demonstrate how to leverage type inference and explicit type annotations for both the data and potential error types, ensuring type safety and improving code maintainability.14 For operations that modify server-side data, such as creating, updating, or deleting, TanStack Query provides the useMutation hook.3 This hook offers a mutationFn to define the API call, a mutate function to trigger the mutation, and various callback functions like onSuccess, onError, and onSettled to handle the different outcomes of the mutation.27The initial setup of TanStack Query in a TypeScript project involves configuring a QueryClient and making it available to the application. A QueryClient instance is created, and the application is then wrapped with a QueryClientProvider, which uses React's context API to make the QueryClient accessible to all useQuery hooks within the component tree.1 The QueryClient can also be configured with default options to customize the behavior of all queries and mutations, such as setting default stale times or retry strategies.3Legend State v3 beta 30 FundamentalsLegend State v3 beta 30 introduces a paradigm centered around Observables, which are the fundamental units of state management.4 An observable can hold any type of data, from simple primitives to complex nested objects, and it automatically notifies any listeners whenever its value changes.4 Interacting with observables is straightforward, using the get() method to retrieve the current value and the set() method to update it.5 A key feature of Legend State is its Fine-grained Reactivity, which optimizes rendering performance by ensuring that only the specific components that depend on the changed parts of the state are re-rendered.5 This is further enhanced by the <Memo> component, which can be used to wrap parts of the UI that depend on observables.5 Computed Observables provide a mechanism to automatically derive and track values based on other observables. These can be defined as functions within an observable or as separate observables that depend on others, updating automatically only when their dependencies change.4Legend State offers built-in Local Persistence capabilities through the syncObservable function and various persistence plugins.4 The syncObservable function can be used to automatically persist the value of an observable to a local storage medium. For browser-based applications, the ObservablePersistLocalStorage plugin is readily available.4 Legend State also provides other plugins like ObservablePersistIndexedDB for more robust local storage solutions.39 The persist option within the syncObservable function allows for configuration of persistence settings, such as specifying a name which serves as the key for storing the data.8To integrate Legend State into a TypeScript project, the @legendapp/state package needs to be installed. Legend State offers several configuration functions, such as enableReactTracking, which can be used to automatically track the usage of observables within React components, simplifying the process of making components reactive to state changes.35Integrating TanStack Query v5+ and Legend State v3 beta 30Several strategies can be employed to integrate TanStack Query for efficient data fetching with Legend State for robust local state management.47 One common approach involves fetching data using TanStack Query's useQuery hook and then manually updating Legend State observables within the onSuccess callback function. This method provides developers with a high degree of control over how the fetched data is processed and stored in Legend State, making it suitable for scenarios where data transformation or custom logic is required before updating the local state. For instance, after a successful API call, the data can be extracted and then used to update a specific observable managed by Legend State.Alternatively, Legend State offers a more integrated solution through its syncedQuery or useObservableSyncedQuery plugin.47 This plugin establishes a direct link between a TanStack Query query and a Legend State observable. When the TanStack Query query successfully fetches or updates data, the linked Legend State observable is automatically updated with the new data. Conversely, changes made to the Legend State observable can potentially trigger updates to the underlying TanStack Query cache or even initiate mutations on the server, depending on the configuration. This approach significantly reduces the boilerplate code required for integration and simplifies the synchronization process between the fetched data and the local state.
```tsx
TypeScriptimport { useQuery, useQueryClient } from '@tanstack/react-query';
import { observable } from '@legendapp/state';
import { use$, $ } from '@legendapp/state/react';

// Legend State observable to store user data
const user$ = observable<{ id: number; name: string } | undefined>(undefined);

// TanStack Query hook to fetch user data
const useUser = (userId: number) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await fetch(`https://api.example.com/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json() as Promise<{ id: number; name: string }>;
    },
    onSuccess: (data) => {
      // Manually update the Legend State observable on successful fetch
      user$.set(data);
    },
  });
};

const UserProfile = ({ userId }: { userId: number }) => {
  const { isPending, isError, error } = useUser(userId);
  const user = use$(user$); // Consume the Legend State observable

  if (isPending) return <p>Loading user...</p>;
  if (isError) return <p>Error fetching user: {error?.message}</p>;

  return (
    <div>
      <h2>User Profile</h2>
      {user && (
        <>
          <p>ID: {user.id}</p>
          <p>Name: {user.name}</p>
        </>
      )}
    </div>
  );
};

```
This example demonstrates fetching user data with TanStack Query and manually updating a Legend State observable in the onSuccess callback. The UserProfile component then consumes the Legend State observable to display the user's information.Implementing Offline Data HandlingTo build applications that function reliably offline, it is crucial to implement mechanisms for detecting network connectivity and for storing data locally when the application is offline. JavaScript provides several ways to detect the network status of a web application.11 The navigator.onLine property returns a boolean value indicating whether the browser is currently online.17 However, it's important to note that this property has limitations and can sometimes return false positives, indicating an online status even when there is no actual internet connectivity.17 A more reliable approach involves listening to the online and offline events on the window object. These events are triggered whenever the browser's network connectivity status changes, allowing the application to react dynamically to these changes.17 For more critical applications, developers might consider implementing a "heartbeat" mechanism, where the application periodically attempts to send a request to a known server to confirm actual internet access.56When the application detects that it is offline, any data fetched from APIs (or intended to be fetched) needs to be stored locally. Legend State's built-in persistence features, particularly the syncObservable function in conjunction with a local storage plugin like ObservablePersistLocalStorage, provide a straightforward way to achieve this. By configuring an observable to be persisted, any changes to its value are automatically saved to the specified local storage medium, ensuring that the data remains available even when the user is offline.Handling mutations (such as creating, updating, or deleting data) while offline requires a different strategy. Since the application cannot communicate with the server, these mutation requests need to be persisted locally and then replayed once the network connection is restored. This can be implemented by storing the mutation requests in a local observable queue managed by Legend State. When a user attempts to perform a mutation offline, instead of directly calling an API, the application adds the mutation request (including all necessary data) to this queue. Legend State's persistence can then be used to save this queue locally.Background Data SynchronizationWhen a user comes back online, the application needs to automatically synchronize the locally stored data and re-attempt any failed offline mutations. TanStack Query's default behavior includes automatically refetching queries that are marked as stale when the network connection is restored (provided the relevant options are configured to enable this).1 This ensures that the local cache maintained by TanStack Query is updated with the latest data from the server without requiring any explicit user action.For replaying offline mutations, Legend State's synchronization features can be utilized.8 The queue of pending offline mutations stored locally can be processed when the application detects that the network is available again. This might involve using Legend State's sync plugins, such as syncedFetch, or implementing a custom synchronization function that iterates through the queue and attempts to execute each mutation against the server. Legend State's persistence can be configured to automatically retry these failed mutations until they are successfully processed by the server.During the synchronization process, there is a potential for data conflicts to arise, especially if the data on the server has been modified while the user was offline. Basic strategies for handling these conflicts include "last-write-wins," where the latest change (either local or server-side) overwrites the other, or optimistic updates with rollback, where the local update is applied immediately, and if it conflicts with a server-side change, the local update is rolled back, and the user might be notified of the conflict.8 More sophisticated conflict resolution strategies might involve comparing timestamps or using specific conflict resolution algorithms based on the application's data model.TypeScript Configuration and ExamplesTo begin, install the necessary packages for both TanStack Query and Legend State using your preferred package manager:Bashnpm install @tanstack/react-query @legendapp/state@beta @legendapp/state/persist-plugins/local-storage
# or
yarn add @tanstack/react-query @legendapp/state@beta @legendapp/state/persist-plugins/local-storage
# or
pnpm add @tanstack/react-query @legendapp/state@beta @legendapp/state/persist-plugins/local-storage
Next, configure the QueryClient for TanStack Query in your TypeScript project. This typically involves creating an instance of QueryClient and wrapping your application's root component with the QueryClientProvider:TypeScriptimport { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
});

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

export default Root;
For Legend State, you might want to enable React tracking and set up the local storage persistence plugin in your application's entry point:TypeScriptimport { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
import { configureObservablePersistence } from '@legendapp/state/persist';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root';

enableReactTracking({ auto: true }); // Automatically track observables in React components

configureObservablePersistence({
  pluginLocal: ObservablePersistLocalStorage,
});

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
Here's an example of making an API call with useQuery in TypeScript, including a custom hook:TypeScriptimport { useQuery } from '@tanstack/react-query';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const fetchTodos = async (): Promise<Todo> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos');
  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }
  return response.json();
};

const useTodos = () => {
  return useQuery<Todo, Error>({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });
};

const TodosList = () => {
  const { data: todos, isPending, isError, error } = useTodos();

  if (isPending) return <p>Loading todos...</p>;
  if (isError) return <p>Error fetching todos: {error?.message}</p>;

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
};
To store the fetched todos locally using Legend State with persistence enabled:TypeScriptimport { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { use$, $ } from '@legendapp/state/react';

// Create a Legend State observable for todos
const localTodos$ = observable<Todo>();

// Persist the todos observable to local storage
syncObservable(localTodos$, { persist: { name: 'todos' } });

const useLocalTodos = () => {
  return use$(localTodos$);
};

const TodosListWithLocalPersistence = () => {
  const todos = useLocalTodos();
  const { data: fetchedTodos, isPending, isError, error, isSuccess } = useTodos();

  React.useEffect(() => {
    if (isSuccess && fetchedTodos) {
      localTodos$.set(fetchedTodos); // Update local state with fetched data
    }
  },);

  if (isPending &&!todos?.length) return <p>Loading todos...</p>;
  if (isError) return <p>Error fetching todos: {error?.message}</p>;

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
};
Implementing a simple offline mutation using Legend State:TypeScriptimport { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { use$, $ } from '@legendapp/state/react';

interface NewTodo {
  title: string;
}

const pendingAddTodos$ = observable<NewTodo>();
syncObservable(pendingAddTodos$, { persist: { name: 'pendingAddTodos' } });

const usePendingAddTodos = () => {
  return use$(pendingAddTodos$);
};

const AddTodoOffline = () => {
  const = React.useState('');
  const pendingTodos = usePendingAddTodos();

  const handleAddTodo = () => {
    if (!navigator.onLine) {
      pendingAddTodos$.push({ title });
      setTitle('');
      alert('Todo added to local queue. Will be synced when online.');
    } else {
      // In a real scenario, you would call a TanStack Query mutation here
      alert('Adding todo online (not implemented in this example).');
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Todo Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={handleAddTodo}>Add Todo</button>
      {pendingTodos?.length > 0 && (
        <div>
          <h3>Pending Todos (Offline)</h3>
          <ul>
            {pendingTodos.map((todo, index) => (
              <li key={index}>{todo.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
These examples illustrate the basic steps for integrating TanStack Query and Legend State with TypeScript to fetch data, store it locally, and handle offline mutations. Remember to define clear interfaces for your API responses and leverage TypeScript's generics for type safety when working with both libraries.ConclusionIntegrating TanStack Query v5+ and Legend State v3 beta 30 offers a robust solution for building offline-first web applications using React and TypeScript. By leveraging TanStack Query's efficient data fetching and caching mechanisms alongside Legend State's powerful local persistence and synchronization capabilities, developers can create applications that provide a seamless user experience, even in the absence of a network connection. This approach leads to faster initial loads, continued functionality during network outages, and enhanced application resilience.While the combination of these libraries provides a strong foundation for offline-first development, it's important to acknowledge that more complex scenarios might require advanced strategies. These could include sophisticated conflict resolution techniques for handling concurrent data modifications, efficient management of large datasets in local storage, and ensuring data consistency across multiple devices or browser sessions. Understanding the nuances of both TanStack Query and Legend State, along with careful planning and implementation, will enable developers to build truly robust and user-friendly offline-first applications.