import { glob } from "glob";
import { basename } from "path";
import { loadFromFile } from "./cheerio";

/** Maps technology to its title for the table of contents */
const technologyTitles = {
	"aria": "ARIA Techniques",
	"client-side-script": "Client-Side Script Techniques",
	"css": "CSS Techniques",
	"failures": "Common Failures",
	"flash": "Flash Techniques",
	"general": "General Techniques",
	"html": "HTML Techniques",
	"pdf": "PDF Techniques",
	"server-side-script": "Server-Side Script Techniques",
	"silverlight": "Silverlight Techniques",
	"smil": "SMIL Techniques",
	"text": "Plain-Text Techniques",
};
type Technology = keyof typeof technologyTitles;
const technologies = Object.keys(technologyTitles) as Technology[];

interface Technique {
	/** Letter(s)-then-number technique code; corresponds to source HTML filename */
	id: string;
	/** Title derived from h1 element in each technique page; may contain HTML */
	titleHtml: string;
}

function assertIsTechnology(technology: string): asserts technology is keyof typeof technologyTitles {
	if (!(technology in technologyTitles)) throw new Error(`Invalid technology name: ${technology}`)
}

/**
 * Returns an object with keys for each technology,
 * each mapping to an array of Techniques.
 * (Functionally equivalent to "techniques-list" target in build.xml)
 **/
export async function getTechniques() {
	const paths = await glob("*/*.html", { cwd: "techniques" });
	const techniques = technologies.reduce((map, technology) => ({
		...map,
		[technology]: [] as string[],
	}), {}) as Record<Technology, Technique[]>;

	for (const path of paths) {
		const [technology, filename] = path.split("/");
		assertIsTechnology(technology);
		techniques[technology].push({
			id: basename(filename, ".html"),
			titleHtml:
				(await loadFromFile(`techniques/${path}`))("h1").html()!.replace(/\s\s+/, " ")
		});
	}

	for (const technology of technologies) {
		techniques[technology].sort((a, b) => {
			const aId = a.id.replace(/[^\d]/g, "");
			const bId = b.id.replace(/[^\d]/g, "");
			if (aId < bId) return -1;
			if (aId > bId) return 1;
			return 0;
		})
	}

	return techniques;
}
