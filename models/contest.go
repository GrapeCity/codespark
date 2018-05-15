package models

import "time"

// Contest represent the contest definitions
type Contest struct {
	Name        string    `json:"name,omitempty" xml:"name,attr"`
	DisplayName string    `json:"displayName,omitempty" xml:"displayName,attr"`
	Description string    `json:"description,omitempty" xml:"description,attr"`
	BeginDate   time.Time `json:"begin,omitempty" xml:"begin,attr"`
	EndDate     time.Time `json:"end,omitempty" xml:"end,attr"`
	IsPublic    bool      `json:"public,omitempty" xml:"public,attr"`
	IsOpen      bool      `json:"open,omitempty" xml:"open,attr"`
	IsHideBoard bool      `json:"hideBoard,omitempty" xml:"hideBoard,attr"`
}
