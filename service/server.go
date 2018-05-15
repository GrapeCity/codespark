package main

import (
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

type Server struct {
	template struct {
		home, dashboard, contest, top10 *template.Template
	}
}

func NewServer() (*Server, error) {
	layout := filepath.Join("template", "layout.tmpl")
	parse := func(name string) (*template.Template, error) {
		t := template.New("") //.Funcs(funcMap)
		return t.ParseFiles(layout, filepath.Join("template", name))
	}
	s := &Server{}
	var err error
	s.template.home, err = parse("home.tmpl")
	if err != nil {
		return nil, err
	}
	//s.template.dashboard, err = parse("dashboard.tmpl")
	//if err != nil {
	//	return nil, err
	//}
	return s, nil
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Printf("Request: %v\n", r.URL.Path)
	var t *template.Template
	switch p := strings.TrimPrefix(r.URL.Path, "/"); p {
	case "/":
		t = s.template.home
		break
	default:
		t = s.template.home
		break
	}
	err := t.ExecuteTemplate(w, "layout", nil)
	if err != nil {
		log.Println(err)
	}
}
