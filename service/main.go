package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

func handleDefault(w http.ResponseWriter, r *http.Request) {
	log.Printf("Request: %s [%s]", r.URL.String(), r.Method)
	w.Write([]byte("Gorilla!\n"))
}

func handleHome(w http.ResponseWriter, r *http.Request) {
	handleDefault(w, r)
}

func handleDashboard(w http.ResponseWriter, r *http.Request) {
	handleDefault(w, r)
}

func handleContest(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fmt.Fprintf(w, "Contest: %v\n", vars["contest"])
	handleDefault(w, r)
}

func handleTop10(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fmt.Fprintf(w, "Contest: %v\n", vars["contest"])
	handleDefault(w, r)
}

func handleJoinContest(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fmt.Fprintf(w, "Contest: %v\n", vars["contest"])
	handleDefault(w, r)
}

func handleSolutions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fmt.Fprintf(w, "Contest: %v, Problem: %v\n", vars["contestId"], vars["problemId"])
	handleDefault(w, r)
}

func handleSolveProblem(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fmt.Fprintf(w, "Contest: %v, Problem: %v\n", vars["contestId"], vars["problemId"])
	handleDefault(w, r)
}

func main() {
	listen := ":5000"
	if debug, ok := os.LookupEnv("DEBUG"); ok && len(debug) > 0 {
		listen = "localhost:5000"
	}

	r := mux.NewRouter()
	r.PathPrefix("/css/").Handler(http.StripPrefix("/css/", http.FileServer(http.Dir("public/css"))))
	r.PathPrefix("/js/").Handler(http.StripPrefix("/js/", http.FileServer(http.Dir("public/js"))))
	r.PathPrefix("/img/").Handler(http.StripPrefix("/img/", http.FileServer(http.Dir("public/img"))))
	r.PathPrefix("/fonts/").Handler(http.StripPrefix("/fonts/", http.FileServer(http.Dir("public/fonts"))))
	r.PathPrefix("/video/").Handler(http.StripPrefix("/video/", http.FileServer(http.Dir("public/video"))))

	r.HandleFunc("/", handleHome).Methods("GET")
	r.HandleFunc("/dashboard", handleDashboard).Methods("GET")
	r.HandleFunc("/contests/{contest}", handleContest).Methods("GET")
	r.HandleFunc("/contests/{contest}/top10", handleTop10).Methods("GET")
	r.HandleFunc("/contests/{contest}/join", handleJoinContest).Methods("POST")

	r.HandleFunc("/sapi/contests/{contestId}/problems/{problemId}", handleSolutions).Methods("GET")
	r.HandleFunc("/sapi/contests/{contestId}/problems/{problemId}", handleSolveProblem).Methods("POST")

	log.Fatal(http.ListenAndServe(listen, r))
}
