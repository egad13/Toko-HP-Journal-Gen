# Toko-HP-Journal-Gen: Project Specifications

## Table of Contents

* Purpose and Overall Function
* Structure of an HP Journal
* Program Input
* Program Output

## Purpose and Overall Function

This application was built on the request of [NorthPaws](northpaws.deviantart.com). It serves as a tool to help players of the ARPG [Tokotas](tokotas.deviantart.com) maintain records known as HP Journals.

In the Tokotas game, players own a number of virtual pets called Tokotas. Each Tokota can participate in the game in various ways through appearing in artwork. Every time a Tokota "does something" through artwork, it increases a stat known as HP. A Tokota's HP stat, and a detailed breakdown of all the artwork it appeared in which contributes to the stat, must be carefully logged in a document known as an HP Journal.

Manually logging artwork for and formatting these HP Journals is time consuming, especially as a Tokota is used more and more. This project aims to provide a standardized way of logging artwork, and automate the generation of formatted HP Journals.

## Structure of an HP Journal

An HP Journal is a text document styled with HTML. It's broken down into 4 types of tiers, each of which has a maximum HP total which must be reached before the next tier appears.

In order, these tiers are:

* **Submissive to Average** - *HP Max: 75* - If a Tokota is 'born submissive', this will be the first tier in its HP Journal.
* **Average to Dominant** - *HP Max: 250* - If a Tokota is *not* born submissive, this will be the first tier in its HP Journal. If it *is* born submissive, this will be the second tier.
* **Dominant to Alpha** - *HP Max: 300* - If a Tokota is *not* born submissive, this will be the second tier in its HP Journal. If it *is* born submissive, this will be the third tier.
* **Extra Slots** - *HP Max: 100* - There may be any amount of Extra Slot categories, as they exist to accommodate HP totals that exceed the previous tiers.

The main unit of an HP Journal is a piece of artwork, otherwise known as a **Thumbnail**. Packaged with the actual artwork is the integer HP value the piece gave the Tokota, and a short description of what aspects of the work gave it that HP value.

If the user chooses, each Thumbnail can also have an associated subcategory. The final journal will organize each larger tier via the subcategories, for an extra level of organization in the document.

Notably, if the total HP of the Thumbnails included in a tier exceed the tier's Hp Maximum, the tier's total is reset to the maximum, and the overflow is transferred to the next tier.

The journal must also include a grand total, ie the total number of HP across all tiers.

## Program Input

The input to this program will be a series of specifically structured strings which represent a single piece of artwork, or Thumb, and names the Tokotas which appear in it.

The format of a valid string is:

`:thumb000000000:,some description of hp breakdown,0,subcategory name,toko name,toko name,toko name...`

Each string must be separated by a newline character, and an empty line will be treated as the end of input.

This input can be provided via a .csv document. It is assumed that the input file will have the first row occupied with column headers, and so the first row of input will always be ignored.

## Program Output

An HP Journal must be uploaded to the site the game takes place on, deviantART. Documents on deviantART are styled with HTML and CSS, so this program outputs HP Journals with appropriate HTML formatting.

The general format that is followed is:

* The grand total, centered, in h3 tags.
* All tiers, in the order described above. Each tier must be formatted as such:
 * The tier's name and total, in h2 tags.
 * If the previous tier had overflow, note the amount carried over from the previous tier, as centered body text.
 * The complete list of Thumbnails included in the tier and their relevant HP information. Thumbnails will always appear sorted by subcategory; if no subcategories were entered in the input, they will retain the ordering they had in the input sequence. This list of Thumbnails will be formatted as such:
   * If subcategory headers were requested, each subcategory will be marked by its title and subtotal, in h3 tags.
   * Individual Thumbnails will appear one of two ways:
     * If the user requested Thumbnails be in blockquote format, then the Thumbnail will be displayed with its HP and HP Breakdown inside blockquote tags.
     * If the user did not request blockquote format, each Thumbnail will appear in a centered div tag.
