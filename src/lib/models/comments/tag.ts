/**
 * A model that represents a single javadoc comment tag.
 *
 * Tags are stored in the {@link Comment.tags} property.
 */
export class CommentTag {
    /**
     * The name of this tag.
     */
    tagName: string;

    /**
     * The name of the related parameter when this is a ```@param``` tag.
     */
    paramName: string;

    /**
     * The actual body text of this tag.
     */
    text: string;

    /**
     * Create a new CommentTag instance.
     */
    constructor(tagName: string, paramName?: string, text?: string) {
        this.tagName = tagName;
        this.paramName = paramName || "";
        this.text = text || "";
    }
}
