FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY PtStudio.Api/PtStudio.Api.csproj PtStudio.Api/
RUN dotnet restore PtStudio.Api/PtStudio.Api.csproj
COPY . .
WORKDIR /src/PtStudio.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "PtStudio.Api.dll"]
