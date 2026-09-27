#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <stack>
#include <climits>
#include <algorithm>
#include <cstdlib>
#include <cstdio>

#include <winsock2.h>
#include <ws2tcpip.h>

using namespace std;

struct Edge
{
    int to;
    int weight;
};

class Graph
{
private:
    vector<string> locations;
    vector<vector<Edge> > graph;

public:

    void addLocation(string name)
    {
        locations.push_back(name);
        graph.push_back(vector<Edge>());
    }

    int findLocation(string name)
    {
        for (int i = 0; i < locations.size(); i++)
        {
            if (locations[i] == name)
                return i;
        }

        return -1;
    }

    void addRoad(string a, string b, int distance)
    {
        int u = findLocation(a);
        int v = findLocation(b);

        if (u == -1 || v == -1)
            return;

        graph[u].push_back(Edge{v, distance});
        graph[v].push_back(Edge{u, distance});
    }

    string bfs(string source)
    {
        int start = findLocation(source);

        if (start == -1)
        {
            return "{\"success\":false,\"message\":\"Location not found\"}";
        }

        vector<bool> visited(locations.size(), false);
        queue<int> q;
        vector<string> result;

        visited[start] = true;
        q.push(start);

        while (!q.empty())
        {
            int current = q.front();
            q.pop();

            result.push_back(locations[current]);

            for (int i = 0; i < graph[current].size(); i++)
            {
                int next = graph[current][i].to;

                if (!visited[next])
                {
                    visited[next] = true;
                    q.push(next);
                }
            }
        }

        string path = "[";

        for (int i = 0; i < result.size(); i++)
        {
            path += "\"";
            path += result[i];
            path += "\"";

            if (i < result.size() - 1)
                path += ",";
        }

        path += "]";

        return
            "{\"success\":true,"
            "\"algorithm\":\"BFS\","
            "\"start\":\"" + source + "\","
            "\"path\":" + path +
            "}";
    }

    string dfs(string source)
    {
        int start = findLocation(source);

        if (start == -1)
        {
            return "{\"success\":false,\"message\":\"Location not found\"}";
        }

        vector<bool> visited(locations.size(), false);
        vector<string> result;

        stack<int> s;

        s.push(start);

        while (!s.empty())
        {
            int current = s.top();
            s.pop();

            if (visited[current])
                continue;

            visited[current] = true;

            result.push_back(locations[current]);

            for (int i = graph[current].size() - 1; i >= 0; i--)
            {
                int next = graph[current][i].to;

                if (!visited[next])
                {
                    s.push(next);
                }
            }
        }

        string path = "[";

        for (int i = 0; i < result.size(); i++)
        {
            path += "\"";
            path += result[i];
            path += "\"";

            if (i < result.size() - 1)
                path += ",";
        }

        path += "]";

        return
            "{\"success\":true,"
            "\"algorithm\":\"DFS\","
            "\"start\":\"" + source + "\","
            "\"path\":" + path +
            "}";
    }

    string dijkstra(string source, string destination)
    {
        int start = findLocation(source);
        int end = findLocation(destination);

        if (start == -1 || end == -1)
        {
            return "{\"success\":false,\"message\":\"Location not found\"}";
        }

        int n = locations.size();

        vector<int> distance(n, INT_MAX);
        vector<int> parent(n, -1);

        priority_queue<
            pair<int, int>,
            vector<pair<int, int> >,
            greater<pair<int, int> >
        > pq;

        distance[start] = 0;

        pq.push(make_pair(0, start));

        while (!pq.empty())
        {
            int currentDistance = pq.top().first;
            int current = pq.top().second;

            pq.pop();

            if (currentDistance > distance[current])
                continue;

            for (int i = 0; i < graph[current].size(); i++)
            {
                int next = graph[current][i].to;
                int weight = graph[current][i].weight;

                if (distance[current] + weight < distance[next])
                {
                    distance[next] =
                        distance[current] + weight;

                    parent[next] = current;

                    pq.push(
                        make_pair(distance[next], next)
                    );
                }
            }
        }

        if (distance[end] == INT_MAX)
        {
            return "{\"success\":false,\"message\":\"No route found\"}";
        }

        vector<string> path;

        int current = end;

        while (current != -1)
        {
            path.push_back(locations[current]);
            current = parent[current];
        }

        reverse(path.begin(), path.end());

        string pathJSON = "[";

        for (int i = 0; i < path.size(); i++)
        {
            pathJSON += "\"";
            pathJSON += path[i];
            pathJSON += "\"";

            if (i < path.size() - 1)
                pathJSON += ",";
        }

        pathJSON += "]";

        string response = "{";

        response += "\"success\":true,";
        response += "\"source\":\"" + source + "\",";
        response += "\"destination\":\"" + destination + "\",";
        response += "\"distance\":" + to_string(distance[end]) + ",";
        response += "\"algorithm\":\"Dijkstra\",";
        response += "\"path\":" + pathJSON;

        response += "}";

        return response;
    }

    void updateRoadTime(int u, int v, int time)
    {
        for (int i = 0; i < graph[u].size(); i++)
        {
            if (graph[u][i].to == v)
            {
                graph[u][i].weight = time;
            }
        }

        for (int i = 0; i < graph[v].size(); i++)
        {
            if (graph[v][i].to == u)
            {
                graph[v][i].weight = time;
            }
        }
    }
};


string urlDecode(string value)
{
    string result;

    for (int i = 0; i < value.length(); i++)
    {
        if (value[i] == '+')
        {
            result += ' ';
        }
        else if (value[i] == '%' && i + 2 < value.length())
        {
            string hex =
                value.substr(i + 1, 2);

            int number = 0;

            sscanf(
                hex.c_str(),
                "%x",
                &number
            );

            result += (char)number;

            i += 2;
        }
        else
        {
            result += value[i];
        }
    }

    return result;
}


string getParameter(string request, string parameter)
{
    string search = parameter + "=";

    size_t position =
        request.find(search);

    if (position == string::npos)
        return "";

    position += search.length();

    size_t end =
        request.find("&", position);

    if (end == string::npos)
        end = request.find(" ", position);

    string value =
        request.substr(
            position,
            end - position
        );

    return urlDecode(value);
}


void sendResponse(
    SOCKET client,
    string body
)
{
    string header;

    header =
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: application/json\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Connection: close\r\n"
        "Content-Length: " +
        to_string(body.length()) +
        "\r\n\r\n";

    string response =
        header + body;

    send(
        client,
        response.c_str(),
        response.length(),
        0
    );
}


int main()
{
    Graph graph;

    graph.addLocation("College");
    graph.addLocation("Market");
    graph.addLocation("Hospital");
    graph.addLocation("Bus Stand");
    graph.addLocation("Railway Station");
    graph.addLocation("Airport");

    graph.addRoad(
        "College",
        "Market",
        4
    );

    graph.addRoad(
        "College",
        "Bus Stand",
        2
    );

    graph.addRoad(
        "Market",
        "Hospital",
        3
    );

    graph.addRoad(
        "Market",
        "Railway Station",
        5
    );

    graph.addRoad(
        "Bus Stand",
        "Railway Station",
        4
    );

    graph.addRoad(
        "Railway Station",
        "Airport",
        6
    );


    WSADATA wsa;

    if (WSAStartup(
            MAKEWORD(2, 2),
            &wsa) != 0)
    {
        cout << "Winsock initialization failed."
             << endl;

        return 1;
    }


    SOCKET serverSocket =
        socket(
            AF_INET,
            SOCK_STREAM,
            IPPROTO_TCP
        );


    if (serverSocket == INVALID_SOCKET)
    {
        cout << "Socket creation failed."
             << endl;

        WSACleanup();

        return 1;
    }


    sockaddr_in serverAddress;

    serverAddress.sin_family =
        AF_INET;

    serverAddress.sin_addr.s_addr =
        INADDR_ANY;

    serverAddress.sin_port =
        htons(8080);


    if (bind(
            serverSocket,
            (sockaddr*)&serverAddress,
            sizeof(serverAddress)) == SOCKET_ERROR)
    {
        cout << "Port 8080 is already in use."
             << endl;

        closesocket(serverSocket);

        WSACleanup();

        return 1;
    }


    if (listen(
            serverSocket,
            10) == SOCKET_ERROR)
    {
        cout << "Server listen failed."
             << endl;

        closesocket(serverSocket);

        WSACleanup();

        return 1;
    }


    cout << endl;
    cout << "======================================" << endl;
    cout << "       SMART CITY ROUTE FINDER API" << endl;
    cout << "======================================" << endl;
    cout << endl;

    cout << "Server running at:" << endl;
    cout << "http://localhost:8080" << endl;
    cout << endl;

    cout << "Available APIs:" << endl;
    cout << "/api/route" << endl;
    cout << "/api/bfs" << endl;
    cout << "/api/dfs" << endl;
    cout << "/api/update-road-time" << endl;
    cout << endl;

    cout << "Press Ctrl+C to stop the server."
         << endl;

    cout << "======================================"
         << endl;


    while (true)
    {
        SOCKET client =
            accept(
                serverSocket,
                NULL,
                NULL
            );


        if (client == INVALID_SOCKET)
            continue;


        char buffer[8192];


        int received =
            recv(
                client,
                buffer,
                sizeof(buffer) - 1,
                0
            );


        if (received > 0)
        {
            buffer[received] = '\0';

            string request(buffer);


            /*
                Dijkstra
            */

            if (request.find("GET /api/route") !=
                string::npos)
            {
                string source =
                    getParameter(
                        request,
                        "source"
                    );

                string destination =
                    getParameter(
                        request,
                        "destination"
                    );


                if (source == "" ||
                    destination == "")
                {
                    sendResponse(
                        client,
                        "{\"success\":false,\"message\":\"Source and destination are required\"}"
                    );
                }
                else
                {
                    string result =
                        graph.dijkstra(
                            source,
                            destination
                        );

                    sendResponse(
                        client,
                        result
                    );
                }
            }


            /*
                BFS
            */

            else if (
                request.find("GET /api/bfs") !=
                string::npos)
            {
                string source =
                    getParameter(
                        request,
                        "source"
                    );


                if (source == "")
                {
                    sendResponse(
                        client,
                        "{\"success\":false,\"message\":\"Source is required\"}"
                    );
                }
                else
                {
                    string result =
                        graph.bfs(source);

                    sendResponse(
                        client,
                        result
                    );
                }
            }


            /*
                DFS
            */

            else if (
                request.find("GET /api/dfs") !=
                string::npos)
            {
                string source =
                    getParameter(
                        request,
                        "source"
                    );


                if (source == "")
                {
                    sendResponse(
                        client,
                        "{\"success\":false,\"message\":\"Source is required\"}"
                    );
                }
                else
                {
                    string result =
                        graph.dfs(source);

                    sendResponse(
                        client,
                        result
                    );
                }
            }


            /*
                Update traffic time
            */

            else if (
                request.find(
                    "GET /api/update-road-time"
                ) != string::npos)
            {
                string source =
                    getParameter(
                        request,
                        "source"
                    );

                string destination =
                    getParameter(
                        request,
                        "destination"
                    );

                string durationText =
                    getParameter(
                        request,
                        "duration"
                    );


                int duration =
                    atoi(
                        durationText.c_str()
                    );


                int u =
                    graph.findLocation(
                        source
                    );

                int v =
                    graph.findLocation(
                        destination
                    );


                if (u == -1 ||
                    v == -1)
                {
                    sendResponse(
                        client,
                        "{\"success\":false,\"message\":\"Location not found\"}"
                    );

                    closesocket(client);

                    continue;
                }


                if (duration <= 0)
                {
                    sendResponse(
                        client,
                        "{\"success\":false,\"message\":\"Invalid duration\"}"
                    );

                    closesocket(client);

                    continue;
                }


                graph.updateRoadTime(
                    u,
                    v,
                    duration
                );


                string response =
                    "{"
                    "\"success\":true,"
                    "\"message\":\"Traffic time updated\","
                    "\"source\":\"" +
                    source +
                    "\","
                    "\"destination\":\"" +
                    destination +
                    "\","
                    "\"duration\":" +
                    to_string(duration) +
                    "}";


                sendResponse(
                    client,
                    response
                );


                closesocket(client);

                continue;
            }


            /*
                Default API
            */

            else
            {
                sendResponse(
                    client,
                    "{\"success\":true,\"message\":\"Smart City Route Finder C++ API is running\"}"
                );
            }
        }


        closesocket(client);
    }


    closesocket(serverSocket);

    WSACleanup();

    return 0;
}